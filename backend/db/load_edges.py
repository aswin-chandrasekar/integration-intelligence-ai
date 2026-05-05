import json
from .db import SessionLocal
from .models import Node, Edge, Evidence
from backend.utils.normalizer import normalize_name

def get_or_create_node(session, name):
    node = session.query(Node).filter_by(name=name).first()
    if not node:
        node = Node(name=name)
        session.add(node)
        session.commit()
    return node

def load_edges(file_path="backend/data/edges.json"):
    session = SessionLocal()

    with open(file_path, "r") as f:
        data = json.load(f)

    for edge in data:
        source_name = normalize_name(edge["source"])
        target_name = normalize_name(edge["target"])

        source_node = get_or_create_node(session, source_name)
        target_node = get_or_create_node(session, target_name)

        edge_obj = Edge(
            source_id=source_node.id,
            target_id=target_node.id
        )
        session.add(edge_obj)
        session.commit()

        for ev in edge.get("evidence", []):
            if isinstance(ev, dict):
                evidence = Evidence(
                    edge_id=edge_obj.id,
                    file=ev.get("file"),
                    line=ev.get("line"),
                    snippet=ev.get("snippet")
                )
            else:
                # fallback if evidence is just a string
                evidence = Evidence(
                    edge_id=edge_obj.id,
                    file="unknown",
                    line=0,
                    snippet=str(ev)
                )

            session.add(evidence)

    session.commit()
    session.close()

if __name__ == "__main__":
    load_edges()