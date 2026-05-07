from collections import defaultdict, deque
import json

import os

def load_edges():
    base_dir = os.path.dirname(os.path.dirname(__file__))
    file_path = os.path.join(base_dir, "data", "edges.json")
    if not os.path.exists(file_path):
        file_path = "backend/data/edges.json"
    with open(file_path) as f:
        return json.load(f)


def build_graph(edges):
    graph = defaultdict(set)

    for e in edges:
        src = e["source"].lower().replace(" ", "-")
        tgt = e["target"].lower().replace(" ", "-")

        graph[src].add(tgt)
        graph[tgt].add(src)

    return graph


def get_impact(node: str, depth: int):
    edges = load_edges()
    graph = build_graph(edges)

    node = node.lower().replace(" ", "-")

    visited = set([node])
    queue = deque([(node, 0)])

    impacted_nodes = set()
    impacted_edges = []

    while queue:
        current, level = queue.popleft()

        if level >= depth:
            continue

        for neighbor in graph[current]:
            if neighbor not in visited:
                visited.add(neighbor)
                impacted_nodes.add(neighbor)

                queue.append((neighbor, level + 1))

    # collect edges
    for e in edges:
        src = e["source"].lower().replace(" ", "-")
        tgt = e["target"].lower().replace(" ", "-")

        if src in impacted_nodes or tgt in impacted_nodes:
            impacted_edges.append(e)

    return {
        "nodes": list(impacted_nodes),
        "edges": impacted_edges
    }