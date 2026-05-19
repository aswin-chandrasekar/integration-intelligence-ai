import ast
import re
from typing import List, Dict, Any, Optional

def extract_route_from_decorator(decorator: ast.expr) -> Optional[Dict[str, Any]]:
    """Extract route information from decorator nodes."""
    if isinstance(decorator, ast.Call):
        if isinstance(decorator.func, ast.Attribute):
            if decorator.func.attr == "route":
                # Extract path from first argument
                if decorator.args and isinstance(decorator.args[0], ast.Constant):
                    path = decorator.args[0].value
                    methods = ["GET"]
                    
                    # Check for methods kwarg
                    for kw in decorator.keywords:
                        if kw.arg == "methods" and isinstance(kw.value, ast.List):
                            methods = [
                                m.value for m in kw.value.elts 
                                if isinstance(m, ast.Constant)
                            ]
                    
                    return {"path": path, "methods": methods}
    
    return None


def extract_indirect_routes(tree: ast.AST) -> List[Dict[str, Any]]:
    """Detect indirect route registrations and blueprints."""
    routes = []
    
    for node in ast.walk(tree):
        # Blueprint.add_url_rule pattern
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute):
            if node.func.attr == "add_url_rule":
                if node.args and len(node.args) >= 1:
                    if isinstance(node.args[0], ast.Constant):
                        route_info = {
                            "path": node.args[0].value,
                            "type": "add_url_rule",
                            "indirect": True
                        }
                        
                        # Extract view_func if provided
                        if len(node.args) > 1 and isinstance(node.args[1], ast.Name):
                            route_info["view_func"] = node.args[1].id
                        
                        # Check for methods kwarg
                        for kw in node.keywords:
                            if kw.arg == "methods" and isinstance(kw.value, ast.List):
                                route_info["methods"] = [
                                    m.value for m in kw.value.elts
                                    if isinstance(m, ast.Constant)
                                ]
                        
                        routes.append(route_info)
        
        # Flask-RESTX/Flask-RESTful routes
        elif isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute):
            if node.func.attr == "add_resource":
                if node.args and len(node.args) >= 2:
                    if isinstance(node.args[1], ast.Constant):
                        routes.append({
                            "path": node.args[1].value,
                            "type": "add_resource",
                            "indirect": True,
                            "framework": "Flask-RESTful"
                        })
    
    return routes


def extract_config_based_routes(file_path: str) -> List[Dict[str, Any]]:
    """Detect routes defined in configuration files or dynamic lists."""
    routes = []
    
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Pattern for ROUTES = [(...), (...)]
        route_list_pattern = r"ROUTES?\s*=\s*\[([\s\S]*?)\]"
        
        for match in re.finditer(route_list_pattern, content):
            config_content = match.group(1)
            # Extract tuples of (path, handler)
            tuple_pattern = r"\(['\"]([^'\"]*)['\"][\s,]*(['\"]?[\w.]+['\"]?)\)"
            for tuple_match in re.finditer(tuple_pattern, config_content):
                routes.append({
                    "path": tuple_match.group(1),
                    "type": "config_list",
                    "indirect": True
                })
    except Exception:
        pass
    
    return routes


def extract_flask_routes(file_path: str) -> List[Dict[str, Any]]:
    """
    Extract Flask routes with improved detection for indirect routes, 
    blueprints, and configuration-based connections.
    """
    routes = []
    
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            tree = ast.parse(content)
        
        # Extract direct @app.route() and @blueprint.route() decorators
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                for decorator in node.decorator_list:
                    if isinstance(decorator, ast.Call) and isinstance(decorator.func, ast.Attribute):
                        if decorator.func.attr == "route":
                            # Extract route info from decorator
                            if decorator.args and isinstance(decorator.args[0], ast.Constant):
                                path = decorator.args[0].value
                                methods = ["GET"]
                                
                                # Extract methods from kwarg
                                for kw in decorator.keywords:
                                    if kw.arg == "methods" and isinstance(kw.value, ast.List):
                                        methods = [
                                            m.value for m in kw.value.elts
                                            if isinstance(m, ast.Constant)
                                        ]
                                
                                routes.append({
                                    "type": "INBOUND_API",
                                    "path": path,
                                    "methods": methods,
                                    "handler": node.name,
                                    "file": file_path,
                                    "line": node.lineno,
                                    "confidence": "100% (AST Route Match)"
                                })
        
        # Extract indirect routes (add_url_rule, add_resource, etc.)
        indirect_routes = extract_indirect_routes(tree)
        for route in indirect_routes:
            routes.append({
                "type": "INBOUND_API",
                "path": route.get("path", "unknown"),
                "registration": route.get("type", "indirect"),
                "framework": route.get("framework", "Flask"),
                "file": file_path,
                "line": 0,  # Line info would need more detailed tracking
                "confidence": "85% (Indirect Route Detection)"
            })
        
        # Extract config-based routes
        config_routes = extract_config_based_routes(file_path)
        for route in config_routes:
            routes.append({
                "type": "INBOUND_API",
                "path": route.get("path", "unknown"),
                "registration": "config_based",
                "file": file_path,
                "line": 0,
                "confidence": "70% (Config-Based Route Detection)"
            })
    
    except Exception as e:
        pass
    
    return routes