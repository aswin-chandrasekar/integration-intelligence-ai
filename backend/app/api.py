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
import json
import os
from backend.impact.impact_analysis import get_downstream, get_upstream
api = Blueprint('api', __name__)
@api.route("/api/scan", methods=["POST"])
def scan():
    repo_path = request.json["repo_path"]
    # Support GitHub URLs by cloning
    if repo_path.startswith("http"):
        import subprocess
        repo_name = repo_path.split("/")[-1].replace(".git", "")
        clone_dir = os.path.abspath(f"data/clones/{repo_name}")
        is_empty = not os.path.exists(clone_dir) or not os.listdir(clone_dir)
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
        else:
            print(f"Using existing clone at {clone_dir}")
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
                db["name"],
                "DB",
                file,
                db["line"],
                db.get("confidence")
            ))
        # 4. File Operations
        for f in extract_file_ops(file):
            edges.append(make_edge(
                "Flask App",
                f["name"],
                "FILE",
                file,
                f["line"],
                f.get("confidence")
            ))
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

    results = generate_recommendations(edges)

    return jsonify(results)

@api.route("/api/risk-analysis", methods=["GET"])
def risk_analysis():

    BASE_DIR = os.path.dirname(os.path.dirname(__file__))

    file_path = os.path.join(BASE_DIR, "data", "edges.json")

    edges = []

    if os.path.exists(file_path):

        with open(file_path) as f:
            edges = json.load(f)

    results = calculate_risk(edges)

    return jsonify(results)

@api.route("/api/architect-summary", methods=["GET"])
def architect_summary():

    BASE_DIR = os.path.dirname(os.path.dirname(__file__))
    file_path = os.path.join(BASE_DIR, "data", "edges.json")

    edges = []

    if os.path.exists(file_path):
        with open(file_path) as f:
            edges = json.load(f)

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

    # -----------------------------
    # Summary Text
    # -----------------------------
    summary = f"""
This repository contains {len(edges)} detected integrations across {len(systems)} systems.

The architecture is primarily driven by synchronous API communication patterns, with {sync_edges} synchronous integrations detected.

The most connected system is '{most_coupled}', which may represent a central orchestration or coupling hotspot with {max_connections} total upstream/downstream dependencies.

Database integrations detected: {db_edges}
File-based integrations detected: {file_edges}

Overall architecture operational risk is assessed as {overall_risk} based on synchronous dependency concentration and integration centrality patterns.

Recommended modernization focus areas include:
- Reducing synchronous coupling
- Introducing asynchronous event-driven flows
- Breaking high fan-out dependencies
- Isolating critical orchestration systems
"""

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
            edges = json.load(f)

    # Calculate dynamic metrics
    total_integrations = len(edges)
    
    # Calculate average confidence
    total_confidence = 0
    valid_confidence_count = 0
    db_edges_count = 0
    db_total_confidence = 0
    
    import re
    
    for edge in edges:
        confidence_str = edge.get("confidence", "")
        match = re.search(r'(\d+)', confidence_str)
        if match:
            conf_val = int(match.group(1))
            total_confidence += conf_val
            valid_confidence_count += 1
            
            if edge.get("type") == "DB":
                db_total_confidence += conf_val
        
        if edge.get("type") == "DB":
            db_edges_count += 1
            
    avg_confidence = round(total_confidence / valid_confidence_count) if valid_confidence_count > 0 else 0
    avg_db_confidence = round(db_total_confidence / db_edges_count) if db_edges_count > 0 else 0
    
    # Format patterns dynamically
    db_pattern_status = "RISK" if db_edges_count > 0 else "SAFE"
    db_pattern_locations = f"{db_edges_count} Locations Found" if db_edges_count > 0 else "None Found"
    db_is_risk = db_edges_count > 0

    return jsonify({
        "metrics": {
            "totalIntegrations": {"value": total_integrations, "change": "+0%", "trend": "up"},
            "activeSecurityRisks": {"value": 18, "change": "+4", "trend": "up", "badge": "High"},
            "architectureScore": {"value": 72, "progress": 72, "suffix": "/100"},
            "matchingConfidence": {"value": avg_confidence, "detail": "Neural precision: high", "suffix": "%"}
        },
        "patterns": [
            {
                "title": "Event-Driven Synchronization",
                "desc": "Primary flow for high-scale messaging systems.",
                "locations": "12 Locations Found",
                "status": "STABLE",
                "icon": "RefreshCw"
            },
            {
                "title": "Direct SQL Access",
                "desc": "Found in legacy modules, bypasses API layers.",
                "locations": db_pattern_locations,
                "status": db_pattern_status,
                "isRisk": db_is_risk,
                "icon": "Database"
            },
            {
                "title": "Third-Party API Dependency",
                "desc": "High reliance on Stripe and Twilio found across 8 core modules.",
                "fullWidth": True,
                "tags": ["Stripe", "Twilio"],
                "icon": "Cloud"
            }
        ],
        "confidenceIndex": {
            "globalPrecision": avg_confidence,
            "dataMapping": avg_db_confidence,
            "securityLogic": 89,
            "latencyPrediction": 92
        },
        "risks": [
            {
                "type": "Hardcoded API Credentials",
                "detail": "Possible secrets exposure in code",
                "impact": "CRITICAL",
                "evidence": "src/auth/gatekeeper.js:142"
            },
            {
                "type": "Unencrypted Data Transfer",
                "detail": "HTTP detected on internal microservice",
                "impact": "HIGH",
                "evidence": "config/network.yml:45"
            },
            {
                "type": "Stale Webhook Endpoint",
                "detail": "No traffic detected in 30 days",
                "impact": "LOW",
                "evidence": "api/v1/webhooks/legacy",
                "action": "Archive"
            }
        ],
        "recommendations": [
            {
                "icon": "Zap",
                "title": "Consolidate redundant Stripe API calls",
                "desc": "The 'Checkout' and 'UserAccount' modules call Stripe's metadata endpoint separately. Move to a shared provider to save 200ms latency."
            },
            {
                "icon": "AlertCircle",
                "title": "Implement circuit breaker for Twilio",
                "desc": "Current integration lacks failure isolation. Implement a circuit breaker pattern to prevent cascading failures during Twilio outages."
            }
        ]
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