from backend.db.db import SessionLocal
from backend.db.models import Node, Edge

def get_downstream(system_name, depth=1):
    session = SessionLocal()

    # find starting node
    start = session.query(Node).filter_by(name=system_name).first()
    if not start:
        return []

    visited = set()
    result = set()

    def dfs(node_id, current_depth):
        if current_depth > depth:
            return

        edges = session.query(Edge).filter_by(source_id=node_id).all()

        for edge in edges:
            target = edge.target
            if target.name not in visited:
                visited.add(target.name)
                result.add(target.name)
                dfs(target.id, current_depth + 1)

    dfs(start.id, 1)

    session.close()
    return list(result)

def get_upstream(system_name, depth=1):
    session = SessionLocal()

    start = session.query(Node).filter_by(name=system_name).first()
    if not start:
        return []

    visited = set()
    result = set()

    def dfs(node_id, current_depth):
        if current_depth > depth:
            return

        edges = session.query(Edge).filter_by(target_id=node_id).all()

        for edge in edges:
            source = edge.source
            if source.name not in visited:
                visited.add(source.name)
                result.add(source.name)
                dfs(source.id, current_depth + 1)

    dfs(start.id, 1)

    session.close()
    return list(result)