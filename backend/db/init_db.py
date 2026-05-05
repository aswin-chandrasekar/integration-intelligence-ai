from .db import engine, Base
from .models import Node, Edge, Evidence

def init_db():
    Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    init_db()