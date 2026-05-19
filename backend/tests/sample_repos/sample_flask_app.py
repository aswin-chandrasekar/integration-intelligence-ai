"""
Sample Flask application for testing integration detection.
Contains various HTTP calls, database operations, and file handling.
"""
import os
import requests
import json
from flask import Flask, request, jsonify
from sqlalchemy import create_engine
import pandas as pd

app = Flask(__name__)

# Direct environment variable usage
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///default.db')
API_KEY = os.getenv('API_KEY')
BASE_URL = os.environ.get('BASE_URL', 'https://api.example.com')

# Config-based database
engine = create_engine(DATABASE_URL)

# Direct Flask routes
@app.route('/api/data', methods=['GET', 'POST'])
def get_data():
    """Direct route decorator."""
    return jsonify({"status": "ok"})


@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """Route with path parameter."""
    return jsonify({"user_id": user_id})


# Indirect route registration
def fetch_external_api():
    """Make HTTP request with dynamic URL composition."""
    # Dynamic URL composition with f-string
    api_endpoint = f"{BASE_URL}/v1/data"
    response = requests.get(api_endpoint)
    return response.json()


def fetch_with_env_var():
    """Fetch using environment variable."""
    url = os.getenv('EXTERNAL_API', 'https://default-api.local')
    return requests.post(url, json={"key": "value"})


def concatenated_url_call():
    """URL built through concatenation."""
    base = "https://api.service.com"
    endpoint = "/v2/endpoint"
    full_url = base + endpoint
    return requests.get(full_url)


def session_based_call():
    """Session-based HTTP call."""
    session = requests.Session()
    session.headers.update({'Authorization': f'Bearer {API_KEY}'})
    return session.get(f"{BASE_URL}/protected")


# File operations
def load_config():
    """Load configuration from file."""
    config_path = os.path.join(os.getenv('CONFIG_DIR', '.'), 'config.json')
    with open(config_path, 'r') as f:
        return json.load(f)


def read_csv_data():
    """Read CSV using pandas."""
    data_file = os.getenv('DATA_FILE', 'data/input.csv')
    df = pd.read_csv(data_file)
    return df


# Blueprint registration (indirect route)
from flask import Blueprint
api_bp = Blueprint('api', __name__, url_prefix='/api/v2')

@api_bp.route('/items', methods=['GET'])
def list_items():
    return jsonify({"items": []})

app.register_blueprint(api_bp)


# Config-based routes
ROUTES = [
    ('/admin/users', 'admin_users', 'GET'),
    ('/admin/stats', 'admin_stats', 'GET, POST'),
]

def register_admin_routes():
    """Register routes from configuration."""
    for path, name, methods in ROUTES:
        app.add_url_rule(path, name, lambda: {"admin": True}, methods=methods.split(','))


if __name__ == '__main__':
    register_admin_routes()
    app.run()
