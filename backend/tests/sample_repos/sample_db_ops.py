"""
Sample database operations for testing DB detection.
Contains various patterns: direct connections, environment configs, and indirect access.
"""
import os
import sqlite3
import sqlalchemy
from sqlalchemy import create_engine, Column, String, Integer
from sqlalchemy.ext.declarative import declarative_base
import psycopg2
import pymongo

# Direct string connections (anti-pattern but common)
sqlite_conn = sqlite3.connect('local.db')

# Environment variable based config
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://user:pass@localhost/db')
db_engine = create_engine(DATABASE_URL)

# Dynamic connection building
def get_db_engine():
    """Get database engine from config."""
    db_type = os.environ.get('DB_TYPE', 'sqlite')
    db_url = os.environ.get('DB_URL')
    return create_engine(db_url)


# PostgreSQL with environment variable
postgres_config = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', 5432)),
    'database': os.getenv('DB_NAME', 'mydb'),
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD')
}
pg_conn = psycopg2.connect(**postgres_config)


# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
mongo_client = pymongo.MongoClient(mongo_url)
db = mongo_client['myapp_db']


# SQLAlchemy model
Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    name = Column(String(50))


# Session usage
from sqlalchemy.orm import sessionmaker
Session = sessionmaker(bind=db_engine)
session = Session()


def query_users():
    """Query using ORM session (indirect)."""
    return session.query(User).all()


# Config-based database selection
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME'),
        'USER': os.getenv('DB_USER'),
        'PASSWORD': os.getenv('DB_PASSWORD'),
        'HOST': os.getenv('DB_HOST'),
        'PORT': 5432,
    },
    'analytics': {
        'ENGINE': 'django.db.backends.mongodb',
        'NAME': 'analytics_db'
    }
}


# Redis connection
import redis
redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379')
cache = redis.from_url(redis_url)


# Cassandra
from cassandra.cluster import Cluster
cassandra_hosts = os.getenv('CASSANDRA_HOSTS', 'localhost').split(',')
cassandra_cluster = Cluster(cassandra_hosts)
cassandra_session = cassandra_cluster.connect()
