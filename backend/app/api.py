from flask import Blueprint, request, jsonify
from backend.app.scanner.repo_scanner import get_python_files
from backend.app.scanner.flask_parser import extract_flask_routes
from backend.app.scanner.outbound_http import extract_http_calls
from backend.app.models.edge import make_edge
import json
from backend.impact.impact_analysis import get_downstream, get_upstream

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

    with open("backend/data/edges.json", "w") as f:
        json.dump(edges, f, indent=2)

    return jsonify({"status": "completed", "edges": len(edges)})

@api.route("/api/edges", methods=["GET"])
def edges():
    import os

    BASE_DIR = os.path.dirname(os.path.dirname(__file__))
    file_path = os.path.join(BASE_DIR, "data", "edges.json")

    with open(file_path) as f:
        return jsonify(json.load(f))

@api.route("/api/impact/<system_name>", methods=["GET"])
def impact(system_name):
    depth = int(request.args.get("depth", 1))

    downstream = get_downstream(system_name, depth)
    upstream = get_upstream(system_name, depth)

    return jsonify({
        "system": system_name,
        "depth": depth,
        "downstream": downstream,
        "upstream": upstream
    })