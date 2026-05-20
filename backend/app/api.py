from collections import defaultdict 
from flask import Blueprint, request, jsonify
from backend.app.scanner.repo_scanner import get_python_files
from backend.app.scanner.flask_parser import extract_flask_routes
from backend.app.scanner.outbound_http import extract_http_calls
from backend.app.scanner.db_parser import extract_db_calls
from backend.app.scanner.file_parser import extract_file_ops
from backend.app.models.edge import make_edge
from backend.classifier.impact import get_impact
from backend.classifier.recommendation_engine import generate_recommendations
from backend.classifier.risk_engine import calculate_risk
from backend.llm.gemini_client import explain_edge, generate_architect_summary, answer_architecture_query, redact_secrets, generate_llm_recommendations
import json
import os
from backend.impact.impact_analysis import get_downstream, get_upstream
api = Blueprint('api', __name__)

def normalize_db_target_name(db_edge: dict) -> str:
    return "DB"


def normalize_file_target_name(file_edge: dict) -> str:
    name = str(file_edge.get("name", "")).lower()
    path = str(
        file_edge.get("path", "")
        or file_edge.get("path_component", "")
        or file_edge.get("path_template", "")
        or file_edge.get("default_path", "")
    ).lower()

    if "json" in name or "json" in path:
        return "JSON Data"
    return "Native File IO"


def sanitize_edge(edge: dict) -> dict:
    edge_type = edge.get("type")
    if edge_type == "DB":
        return {**edge, "target": "DB"}
    if edge_type == "FILE":
        current_target = str(edge.get("target", ""))
        if "json" in current_target.lower():
            return {**edge, "target": "JSON Data"}
        return {**edge, "target": normalize_file_target_name(edge)}
    return edge


@api.route("/api/scan", methods=["POST"])
def scan():
    repo_path = request.json.get("repo_path") or request.json.get("repoPath")
    if not repo_path:
        return jsonify({"error": "repo_path or repoPath is required"}), 400
    # Support GitHub URLs by cloning
    if repo_path.startswith("http"):
        import subprocess
        repo_name = repo_path.split("/")[-1].replace(".git", "")
        clone_dir = os.path.abspath(f"data/clones/{repo_name}")
        is_empty = not os.path.exists(clone_dir) or not os.listdir(clone_dir)

        if not is_empty:
            print(f"Existing clone found at {clone_dir}. Pulling latest updates...")
            try:
                subprocess.run(["git", "pull"], cwd=clone_dir, check=True, capture_output=True)
                print("Git pull successful.")
            except Exception as e:
                print(f"Git pull failed ({e}). Performing clean re-clone...")
                is_empty = True

        if is_empty:
            if os.path.exists(clone_dir):
                import shutil
                shutil.rmtree(clone_dir)
            print(f"Cloning {repo_path} into {clone_dir}...")
            try:
                subprocess.run(["git", "clone", "--depth", "1", repo_path, clone_dir], check=True)
                print("Clone successful.")
            except Exception as e:
                print(f"Clone failed: {e}")
                return jsonify({"status": "failed", "error": f"Git clone failed: {str(e)}"}), 500
        repo_path = clone_dir
    edges = []
    files = get_python_files(repo_path)
    print(f"Found {len(files)} python files to scan.")
    for file in files:
        # 1. API Routes
        for r in extract_flask_routes(file):
            edges.append(make_edge(
                "External Client",
                "Flask App",
                "SYNC_API",
                file,
                r["line"],
                r.get("confidence")
            ))
        # 2. Outbound HTTP
        for c in extract_http_calls(file):
            edges.append(make_edge(
                "Flask App",
                "External Service",
                "SYNC_API",
                file,
                c["line"],
                c.get("confidence")
            ))
        # 3. Database Calls
        for db in extract_db_calls(file):
            edges.append(make_edge(
                "Flask App",
                normalize_db_target_name(db),
                "DB",
                file,
                db.get("line", 0),
                db.get("confidence")
            ))
        # 4. File Operations
        for f in extract_file_ops(file):
            edges.append(make_edge(
                "Flask App",
                normalize_file_target_name(f),
                "FILE",
                file,
                f.get("line", 0),
                f.get("confidence")
            ))
    # Deduplicate edges by (source, target, type, file, line) keeping the highest confidence
    deduped_edges = {}
    for edge in edges:
        key = (edge["source"], edge["target"], edge["type"], edge["file"], edge["line"])
        if key in deduped_edges:
            try:
                # Extract numeric confidence to keep the higher one
                curr_conf = int(edge.get("confidence", "0").split("%")[0])
                prev_conf = int(deduped_edges[key].get("confidence", "0").split("%")[0])
                if curr_conf > prev_conf:
                    deduped_edges[key] = edge
            except Exception:
                pass
        else:
            deduped_edges[key] = edge
    edges = list(deduped_edges.values())

    with open("backend/data/edges.json", "w") as f:
        json.dump(edges, f, indent=2)
    return jsonify({"status": "completed", "edges": len(edges)})
@api.route("/api/edges", methods=["GET"])
def edges():
    BASE_DIR = os.path.dirname(os.path.dirname(__file__))
    file_path = os.path.join(BASE_DIR, "data", "edges.json")
    if not os.path.exists(file_path):
        return jsonify([])
    with open(file_path) as f:
        return jsonify(json.load(f))
@api.route("/api/impact/<system_name>", methods=["GET"])
def system_impact(system_name):
    depth = int(request.args.get("depth", 1))
    direction = request.args.get("direction", "both")

    result = get_impact(system_name, depth, direction)

    # Map backend edge keys ("src_tgt") to UI ReactFlow IDs ("e-src-tgt")
    formatted_edges = [f"e-{key.replace('_', '-')}" for key in result.get("edge_keys", [])]

    return jsonify({
        "nodes": result.get("nodes", []),
        "edges": formatted_edges
    })
@api.route("/api/impact", methods=["GET"])
def node_impact():
    node = request.args.get("node")
    depth = int(request.args.get("depth", 1))
    direction = request.args.get("direction", "both")

    result = get_impact(node, depth, direction)

    return jsonify(result)

@api.route("/api/recommendations", methods=["GET"])
def recommendations():

    BASE_DIR = os.path.dirname(os.path.dirname(__file__))

    file_path = os.path.join(BASE_DIR, "data", "edges.json")

    edges = []

    if os.path.exists(file_path):
        with open(file_path) as f:
            edges = json.load(f)

    llm_recs = generate_llm_recommendations(json.dumps(edges))
    if llm_recs:
        results = llm_recs
    else:
        results = generate_recommendations(edges)

    return jsonify(results)

@api.route("/api/risk-analysis", methods=["GET"])
def risk_analysis():

    BASE_DIR = os.path.dirname(os.path.dirname(__file__))

    file_path = os.path.join(BASE_DIR, "data", "edges.json")

    edges = []

    if os.path.exists(file_path):

        with open(file_path) as f:
            edges = [sanitize_edge(edge) for edge in json.load(f)]

    results = calculate_risk(edges)

    return jsonify(results)

@api.route("/api/architect-summary", methods=["GET"])
def architect_summary():

    BASE_DIR = os.path.dirname(os.path.dirname(__file__))
    file_path = os.path.join(BASE_DIR, "data", "edges.json")

    edges = []

    if os.path.exists(file_path):
        with open(file_path) as f:
            edges = [sanitize_edge(edge) for edge in json.load(f)]

    # -----------------------------
    # System Metrics
    # -----------------------------
    systems = set()

    fan_out = defaultdict(int)
    fan_in = defaultdict(int)

    sync_edges = 0
    db_edges = 0
    file_edges = 0

    for edge in edges:

        source = edge.get("source")
        target = edge.get("target")
        edge_type = edge.get("type")

        systems.add(source)
        systems.add(target)

        fan_out[source] += 1
        fan_in[target] += 1

        if edge_type == "SYNC_API":
            sync_edges += 1

        if edge_type == "DB":
            db_edges += 1

        if edge_type == "FILE":
            file_edges += 1

    # -----------------------------
    # Most Coupled System
    # -----------------------------
    most_coupled = None
    max_connections = 0

    for system in systems:

        total = fan_out[system] + fan_in[system]

        if total > max_connections:
            max_connections = total
            most_coupled = system

    # -----------------------------
    # Risk Level
    # -----------------------------
    if sync_edges >= 10:
        overall_risk = "HIGH"

    elif sync_edges >= 5:
        overall_risk = "MEDIUM"

    else:
        overall_risk = "LOW"

    metrics = {
        "len(edges)": len(edges),
        "len(systems)": len(systems),
        "sync_edges": sync_edges,
        "most_coupled": most_coupled,
        "max_connections": max_connections,
        "db_edges": db_edges,
        "file_edges": file_edges,
        "overall_risk": overall_risk
    }
    llm_result = generate_architect_summary(json.dumps(metrics))
    summary = llm_result.get("summary", "LLM integration disabled or unavailable.")


    return jsonify({
        "summary": summary.strip(),
        "systems": len(systems),
        "integrations": len(edges),
        "syncIntegrations": sync_edges,
        "dbIntegrations": db_edges,
        "fileIntegrations": file_edges,
        "mostCoupledSystem": most_coupled,
        "overallRisk": overall_risk
    })

@api.route("/api/insights", methods=["GET"])
def get_insights():
    BASE_DIR = os.path.dirname(os.path.dirname(__file__))
    file_path = os.path.join(BASE_DIR, "data", "edges.json")

    edges = []
    if os.path.exists(file_path):
        with open(file_path) as f:
            edges = [sanitize_edge(edge) for edge in json.load(f)]

    total_integrations = len(edges)

    total_confidence = 0
    valid_confidence_count = 0

    import re
    for edge in edges:
        confidence_str = edge.get("confidence", "")
        match = re.search(r'(\d+)', str(confidence_str))
        if match:
            conf_val = int(match.group(1))
            total_confidence += conf_val
            valid_confidence_count += 1

    avg_confidence = round(total_confidence / valid_confidence_count) if valid_confidence_count > 0 else 0

    risks_analysis = calculate_risk(edges)
    recommendations = generate_recommendations(edges)

    high_critical_systems = [r for r in risks_analysis if r["riskLevel"] in ["HIGH", "CRITICAL"]]
    active_risks_count = len(high_critical_systems)

    if active_risks_count > 2:
        badge = "Critical"
    elif active_risks_count > 0:
        badge = "High"
    else:
        badge = "Low"

    arch_score = 100
    for r in risks_analysis:
        if r["riskLevel"] == "CRITICAL":
            arch_score -= 15
        elif r["riskLevel"] == "HIGH":
            arch_score -= 10
        elif r["riskLevel"] == "MEDIUM":
            arch_score -= 5

    arch_score = max(0, min(100, arch_score))

    patterns = []
    has_event_driven = any(e.get("type") in ["PUB_SUB", "ASYNC_API"] for e in edges)
    sync_count = len([e for e in edges if e.get("type") == "SYNC_API"])

    if has_event_driven or sync_count < total_integrations * 0.3:
        patterns.append({
            "title": "Event-Driven Synchronization",
            "desc": "Primary flow for high-scale messaging systems." if has_event_driven else "Limited synchronous coupling detected.",
            "locations": "Recommended Pattern",
            "status": "STABLE" if has_event_driven else "OPTIMAL",
            "icon": "RefreshCw"
        })

    db_count = len([e for e in edges if e.get("type") == "DB"])
    if db_count > 0:
        patterns.append({
            "title": "Direct SQL Access",
            "desc": "Found in legacy modules, bypasses API layers.",
            "locations": f"{db_count} Locations Found",
            "status": "RISK",
            "isRisk": True,
            "icon": "Database"
        })

    formatted_risks = []
    for r in high_critical_systems:
        formatted_risks.append({
            "type": "System Coupling Risk",
            "detail": f"System '{r['system']}' has high centrality/sync depth.",
            "impact": r["riskLevel"],
            "evidence": f"Fan-Out: {r['fanOut']}, Sync Depth: {r['syncDepth']}",
            "action": "Investigate"
        })

    if db_count > 0:
        formatted_risks.append({
            "type": "Direct Database Access",
            "detail": f"{db_count} direct database connections detected",
            "impact": "HIGH" if db_count > 3 else "MEDIUM",
            "evidence": "Multiple integration points",
            "action": "Implement API abstraction"
        })

    file_count = len([e for e in edges if e.get("type") == "FILE"])
    if file_count > 0:
        formatted_risks.append({
            "type": "Legacy File-Based Integration",
            "detail": f"{file_count} file-based integrations found",
            "impact": "MEDIUM",
            "evidence": "File system dependencies",
            "action": "Migrate to API"
        })

    metrics_for_llm = {
        "total_integrations": total_integrations,
        "sync_apis": sync_count,
        "databases": db_count,
    }
    llm_result = generate_architect_summary(json.dumps(metrics_for_llm))
    action_items = llm_result.get("action_items", [])

    formatted_recs = []
    if action_items:
        for item in action_items[:3]:
            formatted_recs.append({
                "icon": "Zap",
                "title": "AI Recommendation",
                "desc": item
            })
    else:
        # Fallback to deterministic rules if LLM fails
        for i, rec in enumerate(recommendations[:3]):
            formatted_recs.append({
                "icon": "AlertCircle" if rec["severity"] in ["HIGH", "CRITICAL"] else "Zap",
                "title": rec["title"],
                "desc": rec["why"] + " " + rec["recommendation"]
            })

    return jsonify({
        "metrics": {
            "totalIntegrations": {"value": total_integrations, "change": "+0%", "trend": "up"},
            "activeSecurityRisks": {"value": active_risks_count, "change": f"+{active_risks_count}" if active_risks_count > 0 else "+0", "trend": "stable", "badge": badge},
            "architectureScore": {"value": arch_score, "progress": arch_score, "suffix": "/100"},
            "matchingConfidence": {"value": avg_confidence, "detail": f"Neural precision: {'high' if avg_confidence > 90 else 'medium'}", "suffix": "%"}
        },
        "patterns": patterns,
        "confidenceIndex": {
            "globalPrecision": avg_confidence,
            "dataMapping": min(100, avg_confidence + 5),
            "securityLogic": min(100, max(0, avg_confidence - 2)),
            "latencyPrediction": min(100, avg_confidence + 2)
        },
        "risks": formatted_risks,
        "recommendations": formatted_recs
    })

@api.route("/api/export/mermaid", methods=["GET"])
def export_mermaid():

    system = request.args.get("system")

    BASE_DIR = os.path.dirname(os.path.dirname(__file__))
    file_path = os.path.join(BASE_DIR, "data", "edges.json")

    if not os.path.exists(file_path):
        return jsonify({
            "diagram": "graph TD\nA[No Data]"
        })

    with open(file_path) as f:
        edges = json.load(f)

    relevant_edges = []

    # If system selected → export only related graph
    if system:
        normalized = system.lower().replace(" ", "-")

        for edge in edges:

            src = edge.get("source", "")
            tgt = edge.get("target", "")

            src_id = src.lower().replace(" ", "-")
            tgt_id = tgt.lower().replace(" ", "-")

            if normalized in [src_id, tgt_id]:
                relevant_edges.append(edge)

    else:
        relevant_edges = edges

    lines = ["graph TD"]

    added = set()

    for edge in relevant_edges:

        src = edge["source"]
        tgt = edge["target"]
        edge_type = edge.get("type", "LINK")

        key = f"{src}->{tgt}"

        if key in added:
            continue

        added.add(key)

        lines.append(
            f'    "{src}" -->|{edge_type}| "{tgt}"'
        )

    diagram = "\n".join(lines)

    return jsonify({
        "diagram": diagram
    })

@api.route("/api/llm/explain", methods=["POST"])
def api_llm_explain():
    data = request.json
    source = data.get("source")
    target = data.get("target")
    edge_type = data.get("type")
    evidence = data.get("evidence", "")

    redacted_evidence = redact_secrets(evidence)
    explanation = explain_edge(source, target, edge_type, redacted_evidence)
    return jsonify({"explanation": explanation})

@api.route("/api/llm/summary", methods=["GET"])
def api_llm_summary():
    # Gather basic metrics to pass to LLM
    BASE_DIR = os.path.dirname(os.path.dirname(__file__))
    file_path = os.path.join(BASE_DIR, "data", "edges.json")

    edges = []
    if os.path.exists(file_path):
        with open(file_path) as f:
            edges = json.load(f)

    metrics = {
        "total_integrations": len(edges),
        "sync_apis": len([e for e in edges if e.get("type") == "SYNC_API"]),
        "databases": len([e for e in edges if e.get("type") == "DB"]),
    }

    summary_data = generate_architect_summary(json.dumps(metrics))
    return jsonify(summary_data)

@api.route("/api/llm/query", methods=["POST"])
def api_llm_query():
    data = request.json
    query = data.get("query")

    BASE_DIR = os.path.dirname(os.path.dirname(__file__))
    file_path = os.path.join(BASE_DIR, "data", "edges.json")

    edges = []
    if os.path.exists(file_path):
        with open(file_path) as f:
            edges = json.load(f)

    sanitized_graph = redact_secrets(json.dumps([{"s": e.get("source"), "t": e.get("target"), "type": e.get("type")} for e in edges]))

    answer = answer_architecture_query(query, sanitized_graph)
    return jsonify({"answer": answer})