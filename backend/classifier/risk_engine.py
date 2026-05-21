from collections import defaultdict, deque


def normalize_target_name(target, edge_type):
    if edge_type == "DB":
        return "DB"
    if edge_type == "FILE":
        name = str(target or "").lower()
        if "json" in name:
            return "JSON Data"
        return "Native File IO"
    return target


def calculate_risk(edges):

    fan_out = defaultdict(int)
    fan_in = defaultdict(int)

    sync_graph = defaultdict(list)

    systems = set()

    # -----------------------------------
    # Build Metrics
    # -----------------------------------

    seen_edges = set()

    for edge in edges:

        source = edge.get("source")
        target = normalize_target_name(edge.get("target"), edge.get("type"))
        edge_type = edge.get("type")
        edge_key = (source, target, edge_type)

        if edge_key in seen_edges:
            continue
        seen_edges.add(edge_key)

        systems.add(source)
        systems.add(target)

        fan_out[source] += 1
        fan_in[target] += 1

        if edge_type == "SYNC_API":
            sync_graph[source].append(target)

    # -----------------------------------
    # Sync Chain Depth
    # -----------------------------------

    def get_sync_depth(start):

        visited = set()

        queue = deque([(start, 0)])

        max_depth = 0

        while queue:

            node, depth = queue.popleft()

            max_depth = max(max_depth, depth)

            for neighbor in sync_graph[node]:

                if neighbor not in visited:

                    visited.add(neighbor)

                    queue.append((neighbor, depth + 1))

        return max_depth

    # -----------------------------------
    # Final Risk Calculation
    # -----------------------------------

    results = []

    for system in systems:

        out_degree = fan_out[system]

        in_degree = fan_in[system]

        sync_depth = get_sync_depth(system)

        # Centrality Proxy
        centrality = out_degree + in_degree

        # Weighted Risk Score
        risk_score = (
            (out_degree * 15) +
            (in_degree * 10) +
            (sync_depth * 20)
        )

        # Risk Level
        if risk_score >= 100:
            risk_level = "CRITICAL"

        elif risk_score >= 60:
            risk_level = "HIGH"

        elif risk_score >= 30:
            risk_level = "MEDIUM"

        else:
            risk_level = "LOW"

        results.append({
            "system": system,

            "fanOut": out_degree,

            "fanIn": in_degree,

            "centrality": centrality,

            "syncDepth": sync_depth,

            "riskScore": risk_score,

            "riskLevel": risk_level
        })

    # Highest risk first
    results.sort(
        key=lambda x: x["riskScore"],
        reverse=True
    )

    return results