from backend.db.db import SessionLocal
from backend.db.models import Edge, Evidence
from backend.classifier.pattern_classifier import classify_edge

def run_classification():
    session = SessionLocal()

    edges = session.query(Edge).all()

    for edge in edges:
        evidences = session.query(Evidence).filter_by(edge_id=edge.id).all()

        detected_type = "unknown"

        for ev in evidences:
            detected_type = classify_edge(ev.snippet)

            if detected_type != "unknown":
                break  # stop at first strong signal

        edge.type = detected_type
        session.add(edge)

    session.commit()
    session.close()

if __name__ == "__main__":
    run_classification()