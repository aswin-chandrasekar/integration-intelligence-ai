import ast
 
def extract_flask_routes(file_path):
    routes = []
    with open(file_path, "r", encoding="utf-8") as f:
        tree = ast.parse(f.read())
 
    for node in ast.walk(tree):
        if isinstance(node, ast.Call) and hasattr(node.func, 'attr'):
            if node.func.attr == "route":
                routes.append({
                    "type": "INBOUND_API",
                    "path": file_path,
                    "line": node.lineno,
                    "confidence": "100% (AST Route Match)"
                })
 
    return routes