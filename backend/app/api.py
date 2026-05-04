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

    # Support GitHub URLs by cloning
    if repo_path.startswith("http"):
        import subprocess
        import os
        repo_name = repo_path.split("/")[-1].replace(".git", "")
        clone_dir = os.path.abspath(f"data/clones/{repo_name}")
        # Check if dir exists AND is not empty
        is_empty = not os.path.exists(clone_dir) or not os.listdir(clone_dir)

        if is_empty:
            if os.path.exists(clone_dir):
                import shutil
                shutil.rmtree(clone_dir) # Clear any partial clones

            print(f"Cloning {repo_path} into {clone_dir}...")
            try:
                subprocess.run(["git", "clone", "--depth", "1", repo_path, clone_dir], check=True)
                print("Clone successful.")
            except Exception as e:
                print(f"Clone failed: {e}")
                return jsonify({"status": "failed", "error": f"Git clone failed: {str(e)}"}), 500
        else:
            print(f"Using existing clone at {clone_dir}")
        repo_path = clone_dir

    edges = []
    files = get_python_files(repo_path)
    print(f"Found {len(files)} python files to scan.")

    for file in files:
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