from flask import Blueprint, request, jsonify
from app.scanner.repo_scanner import get_python_files
from app.scanner.flask_parser import extract_flask_routes
from app.scanner.outbound_http import extract_http_calls
from app.models.edge import make_edge
import json
 
api = Blueprint('api', __name__)
 
@api.route("/api/scan", methods=["POST"])
def scan():
    repo_path = request.json["repo_path"]
    edges = []
 
    for file in get_python_files(repo_path):
        for r in extract_flask_routes(file):
            edges.append(make_edge(
                "External Client",
                "Flask App",
                "SYNC_API",
                file,
                r["line"]
            ))
 
        for c in extract_http_calls(file):
            edges.append(make_edge(
                "Flask App",
                "External Service",
                "SYNC_API",
                file,
                c["line"]
            ))
 
    with open("data/edges.json", "w") as f:
        json.dump(edges, f, indent=2)
 
    return jsonify({"status": "completed", "edges": len(edges)})
 
@api.route("/api/edges", methods=["GET"])
def edges():
    with open("data/edges.json") as f:
        return jsonify(json.load(f))