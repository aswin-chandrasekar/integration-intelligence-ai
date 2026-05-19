from collections import defaultdict


def generate_recommendations(edges):
    recommendations = []

    # -----------------------------
    # Metrics
    # -----------------------------
    fan_out = defaultdict(int)
    sync_edges = []
    db_edges = []
    file_edges = []

    for edge in edges:
        source = edge.get("source")
        edge_type = edge.get("type")

        fan_out[source] += 1

        if edge_type == "SYNC_API":
            sync_edges.append(edge)

        elif edge_type == "DB":
            db_edges.append(edge)

        elif edge_type == "FILE":
            file_edges.append(edge)

    # -----------------------------
    # 1. High Fan-Out Systems
    # -----------------------------
    high_fan_out_systems = [sys for sys, count in fan_out.items() if count >= 3]
    if high_fan_out_systems:
        systems_str = ", ".join(high_fan_out_systems)
        recommendations.append({
            "system": "Multiple" if len(high_fan_out_systems) > 1 else high_fan_out_systems[0],
            "title": "High Coupling Detected",
            "severity": "HIGH",
            "why": f"Systems ({systems_str}) communicate with 3 or more downstream systems, increasing cascading failure risk.",
            "recommendation": "Introduce API gateway, async messaging, or service boundaries to reduce tight coupling.",
            "steps": [
                "Identify redundant downstream calls",
                "Move non-critical operations to async queues",
                "Introduce caching layer",
                "Add circuit breakers"
            ]
        })

    # -----------------------------
    # 2. Heavy Sync API Usage
    # -----------------------------
    if len(sync_edges) >= 5:

        recommendations.append({
            "system": "Architecture",
            "title": "Excessive Synchronous APIs",
            "severity": "MEDIUM",
            "why": f"{len(sync_edges)} synchronous integrations detected. Long sync chains increase latency and outage propagation.",
            "recommendation": "Convert non-critical APIs to event-driven messaging.",
            "steps": [
                "Identify fire-and-forget APIs",
                "Introduce Kafka/RabbitMQ",
                "Implement retry queues",
                "Decouple long-running workflows"
            ]
        })

    # -----------------------------
    # 3. Direct DB Access
    # -----------------------------
    db_systems = list(set([edge.get("source") for edge in db_edges]))
    if db_systems:
        systems_str = ", ".join(db_systems)
        recommendations.append({
            "system": "Multiple" if len(db_systems) > 1 else db_systems[0],
            "title": "Direct Database Coupling",
            "severity": "HIGH",
            "why": f"Systems ({systems_str}) directly access the database ({len(db_edges)} connection(s) detected).",
            "recommendation": "Encapsulate DB access behind service APIs.",
            "steps": [
                "Create repository/service layer",
                "Replace raw SQL with API abstraction",
                "Limit cross-service DB sharing",
                "Add DB access monitoring"
            ]
        })

    # -----------------------------
    # 4. File-Based Integration
    # -----------------------------
    if len(file_edges) > 0:
        file_systems = list(set([edge.get("source") for edge in file_edges]))
        systems_str = ", ".join(file_systems)
        recommendations.append({
            "system": "Multiple" if len(file_systems) > 1 else file_systems[0],
            "title": "Legacy File-Based Integration",
            "severity": "MEDIUM",
            "why": f"File transfer based integration detected in ({systems_str}) ({len(file_edges)} connection(s) detected).",
            "recommendation": "Replace batch/file integrations with APIs or event streams.",
            "steps": [
                "Identify batch dependencies",
                "Introduce webhook/event triggers",
                "Replace polling with push model",
                "Reduce manual reconciliation"
            ]
        })

    return recommendations