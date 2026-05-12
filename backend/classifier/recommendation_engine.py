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
    for system, count in fan_out.items():

        if count >= 3:
            recommendations.append({
                "system": system,

                "title": "High Coupling Detected",

                "severity": "HIGH",

                "why": f"{system} communicates with {count} downstream systems, increasing cascading failure risk.",

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
    db_systems = set()
    for edge in db_edges:
        system = edge.get("source")
        if system not in db_systems:
            db_systems.add(system)
            recommendations.append({
                "system": system,

                "title": "Direct Database Coupling",

                "severity": "HIGH",

                "why": f"{system} directly accesses database ({len([e for e in db_edges if e.get('source') == system])} connection(s) detected).",

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
        file_systems = set()
        for edge in file_edges:
            system = edge.get("source")
            if system not in file_systems:
                file_systems.add(system)
                recommendations.append({
                    "system": system,

                    "title": "Legacy File-Based Integration",

                    "severity": "MEDIUM",

                    "why": f"File transfer based integration detected ({len([e for e in file_edges if e.get('source') == system])} connection(s) detected).",

                    "recommendation": "Replace batch/file integrations with APIs or event streams.",

                    "steps": [
                        "Identify batch dependencies",
                        "Introduce webhook/event triggers",
                        "Replace polling with push model",
                        "Reduce manual reconciliation"
                    ]
                })

    return recommendations