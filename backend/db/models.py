from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from .db import Base

class Node(Base):
    __tablename__ = "nodes"

    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True)

class Edge(Base):
    __tablename__ = "edges"

    id = Column(Integer, primary_key=True)
    source_id = Column(Integer, ForeignKey("nodes.id"))
    target_id = Column(Integer, ForeignKey("nodes.id"))
    type = Column(String)  # will use later for classification

    source = relationship("Node", foreign_keys=[source_id])
    target = relationship("Node", foreign_keys=[target_id])

class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(Integer, primary_key=True)
    edge_id = Column(Integer, ForeignKey("edges.id"))
    file = Column(String)
    line = Column(Integer)
    snippet = Column(String)

    edge = relationship("Edge")