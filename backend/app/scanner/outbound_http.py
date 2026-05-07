import ast
 
HTTP_LIBS = {"requests", "httpx"}
 
def extract_http_calls(file_path):
    calls = []
    with open(file_path, "r", encoding="utf-8") as f:
        tree = ast.parse(f.read())
 
    for node in ast.walk(tree):
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute):
            if getattr(node.func.value, "id", None) in HTTP_LIBS:
                calls.append({
                    "type": "OUTBOUND_HTTP",
                    "file": file_path,
                    "line": node.lineno,
                    "confidence": "95% (AST HTTP Call)"
                })
    return calls