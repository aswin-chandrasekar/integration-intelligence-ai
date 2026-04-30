import ast

file_path = "c:\\Users\\aswin.chandrasekar\\Desktop\\integration-intelligence-ai\\backend\\app\\api.py"
with open(file_path, "r") as f:
    tree = ast.parse(f.read())

routes = []
for node in ast.walk(tree):
    if isinstance(node, ast.Call) and hasattr(node.func, 'attr'):
        if node.func.attr == "route":
            routes.append(node.lineno)

print("Routes:", routes)
