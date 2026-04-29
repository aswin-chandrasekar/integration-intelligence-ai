import ast
 
HTTP_LIBS = {"requests", "httpx"}
 
def extract_http_calls(file_path):
    calls = []
    with open(file_path, "r") as f:
        tree = ast.parse(f.read())
 
    for node in ast.walk(tree):
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute):
            if node.func.value.id in HTTP_LIBS:
                calls.append({
                    "type": "OUTBOUND_HTTP",
                    "file": file_path,
                    "line": node.lineno
                })
    return calls