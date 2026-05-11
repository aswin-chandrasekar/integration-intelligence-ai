from collections import defaultdict, deque
import json
import os

import re

def load_edges():
    base_dir = os.path.dirname(os.path.dirname(__file__))
    file_path = os.path.join(base_dir, "data", "edges.json")
    if not os.path.exists(file_path):
        file_path = "backend/data/edges.json"
    if not os.path.exists(file_path):
        return []
    with open(file_path) as f:
        return json.load(f)

def normalize_id(text: str) -> str:
    return re.sub(r'\s+', '-', text.strip().lower())

def get_impact(node: str, depth: int, direction: str = "both"):
    edges = load_edges()
    node_id = normalize_id(node)
    
    # Build directed maps
    down_map = defaultdict(set)
    up_map = defaultdict(set)
    
    for e in edges:
        src = normalize_id(e["source"])
        tgt = normalize_id(e["target"])
        down_map[src].add(tgt)
        up_map[tgt].add(src)
        
    impacted_nodes = {node_id}
    impacted_edge_keys = set() # Store as "src_tgt"
    
    visited = {node_id}
    queue = deque([(node_id, 0)])
    
    while queue:
        curr, lvl = queue.popleft()
        
        if lvl >= depth:
            continue
            
        # Traverse Downstream
        if direction in ("downstream", "both"):
            for neighbor in down_map[curr]:
                # Capture edge MUST point from curr to neighbor
                impacted_edge_keys.add(f"{curr}_{neighbor}")
                if neighbor not in visited:
                    visited.add(neighbor)
                    impacted_nodes.add(neighbor)
                    queue.append((neighbor, lvl + 1))
                    
        # Traverse Upstream
        if direction in ("upstream", "both"):
            for neighbor in up_map[curr]:
                # Capture edge MUST point from neighbor to curr (upstream flow)
                impacted_edge_keys.add(f"{neighbor}_{curr}")
                if neighbor not in visited:
                    visited.add(neighbor)
                    impacted_nodes.add(neighbor)
                    queue.append((neighbor, lvl + 1))
                    
    return {
        "nodes": list(impacted_nodes),
        "edge_keys": list(impacted_edge_keys)
    }