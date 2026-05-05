from backend.db.db import SessionLocal
from backend.db.models import Edge

session = SessionLocal()

for e in session.query(Edge).all():
    print(e.source_id, "->", e.target_id, "|", e.type)