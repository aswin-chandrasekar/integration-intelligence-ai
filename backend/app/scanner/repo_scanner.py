import os
 
def get_python_files(repo_path):
    files = []
    ignore_dirs = {'.git', '.github', 'node_modules', 'venv', '.venv', 'env', 'data', 'clones', '__pycache__'}
    for root, dirs, filenames in os.walk(repo_path):
        # Modify dirs in-place to avoid descending into ignored directories
        dirs[:] = [d for d in dirs if d not in ignore_dirs]
        for f in filenames:
            if f.endswith(".py"):
                files.append(os.path.join(root, f))
    return files

    