import ast
import re
from typing import List, Dict, Any, Optional, Tuple
 
HTTP_LIBS = {"requests", "httpx", "urllib", "aiohttp"}

# Helper Functions for URL and Environment Variable Detection

def extract_env_vars(file_path: str) -> Dict[str, str]:
    """Extract environment variable assignments and retrievals from file."""
    env_vars = {}
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        # Match os.getenv() and os.environ.get() patterns
        getenv_pattern = r"os\.getenv\(['\"]([^'\"]+)['\"]\s*(?:,\s*['\"]([^'\"]*)['\"])?\)"
        environ_pattern = r"os\.environ\.get\(['\"]([^'\"]+)['\"]\s*(?:,\s*['\"]([^'\"]*)['\"])?\)"
        
        for match in re.finditer(getenv_pattern, content):
            env_var = match.group(1)
            default = match.group(2) or ""
            env_vars[env_var] = default
            
        for match in re.finditer(environ_pattern, content):
            env_var = match.group(1)
            default = match.group(2) or ""
            env_vars[env_var] = default
    except Exception as e:
        pass
    
    return env_vars


def detect_environment_var_usage(node: ast.expr) -> Optional[Tuple[str, bool]]:
    """
    Detect if an expression uses environment variables.
    Returns (env_var_name, is_dynamic) or None.
    """
    if isinstance(node, ast.Call):
        # Check for os.getenv() or os.environ.get()
        if isinstance(node.func, ast.Attribute):
            if node.func.attr == "getenv" and isinstance(node.func.value, ast.Name):
                if node.func.value.id == "os" and node.args:
                    if isinstance(node.args[0], ast.Constant):
                        return (node.args[0].value, True)
            elif node.func.attr == "get" and isinstance(node.func.value, ast.Subscript):
                # os.environ.get()
                if isinstance(node.func.value.value, ast.Attribute):
                    if (node.func.value.value.attr == "environ" and 
                        isinstance(node.func.value.value.value, ast.Name) and
                        node.func.value.value.value.id == "os"):
                        if node.args and isinstance(node.args[0], ast.Constant):
                            return (node.args[0].value, True)
    
    return None


def reconstruct_url_composition(node: ast.expr, depth: int = 0) -> Optional[str]:
    """
    Reconstruct dynamically composed URLs from AST nodes.
    Handles f-strings, concatenation, and base_url + endpoint patterns.
    Returns reconstructed URL pattern or None.
    """
    if depth > 5:  # Prevent infinite recursion
        return None
    
    if isinstance(node, ast.Constant):
        if isinstance(node.value, str):
            return node.value
    
    elif isinstance(node, ast.JoinedStr):
        # f-string: f"http://{host}:{port}/api"
        parts = []
        for value in node.values:
            if isinstance(value, ast.Constant):
                parts.append(value.value)
            elif isinstance(value, ast.FormattedValue):
                # Extract variable name for dynamic parts
                if isinstance(value.value, ast.Name):
                    parts.append(f"${{{value.value.id}}}")
                else:
                    parts.append("${...}")
            else:
                parts.append("${...}")
        return "".join(parts)
    
    elif isinstance(node, ast.BinOp) and isinstance(node.op, ast.Add):
        # String concatenation: base_url + endpoint
        left = reconstruct_url_composition(node.left, depth + 1)
        right = reconstruct_url_composition(node.right, depth + 1)
        if left and right:
            return left + right
    
    elif isinstance(node, ast.Call):
        # .format() or .join() methods
        if isinstance(node.func, ast.Attribute):
            if node.func.attr == "format":
                base = reconstruct_url_composition(node.func.value, depth + 1)
                if base:
                    return base + "({format_args})"
            elif node.func.attr == "join":
                return "join_pattern"
    
    elif isinstance(node, ast.Name):
        return f"${{{node.id}}}"
    
    return None


def extract_url_argument(node: ast.expr) -> Tuple[Optional[str], Optional[str], float]:
    """
    Extract URL from function call arguments.
    Returns (url, source_type, confidence_boost).
    """
    url = None
    source = None
    confidence = 0.0
    
    if isinstance(node, ast.Constant) and isinstance(node.value, str):
        url = node.value
        source = "literal_string"
        confidence = 0.95
    
    elif isinstance(node, ast.JoinedStr):
        url = reconstruct_url_composition(node)
        source = "f_string"
        confidence = 0.75
    
    elif isinstance(node, ast.BinOp):
        url = reconstruct_url_composition(node)
        source = "concatenation"
        confidence = 0.70
    
    elif isinstance(node, ast.Call):
        env_var = detect_environment_var_usage(node)
        if env_var:
            url = f"env_var:{env_var[0]}"
            source = "environment_variable"
            confidence = 0.65
    
    elif isinstance(node, ast.Name):
        url = f"variable:{node.id}"
        source = "variable_reference"
        confidence = 0.50
    
    return (url, source, confidence)
 
def extract_http_calls(file_path: str) -> List[Dict[str, Any]]:
    """
    Extract HTTP calls with improved detection for dynamic URLs and environment variables.
    """
    calls = []
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            tree = ast.parse(content)
        
        # Pre-scan for environment variables
        env_vars = extract_env_vars(file_path)
        
        for node in ast.walk(tree):
            if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute):
                
                # Standard HTTP library calls: requests.get, httpx.post, etc.
                func_obj = node.func.value
                if isinstance(func_obj, ast.Name) and func_obj.id in HTTP_LIBS:
                    method = node.func.attr
                    url = None
                    source = "direct_call"
                    confidence = 0.95
                    
                    # Extract URL from first positional argument
                    if node.args:
                        url, src_type, conf_boost = extract_url_argument(node.args[0])
                        source = src_type or source
                        confidence = max(confidence - conf_boost, 0.50)
                    
                    # Or from 'url' keyword argument
                    elif node.keywords:
                        for kw in node.keywords:
                            if kw.arg == "url":
                                url, src_type, conf_boost = extract_url_argument(kw.value)
                                source = src_type or source
                                confidence = max(confidence - conf_boost, 0.50)
                                break
                    
                    calls.append({
                        "type": "OUTBOUND_HTTP",
                        "method": method,
                        "url": url or "unknown",
                        "source": source,
                        "file": file_path,
                        "line": node.lineno,
                        "confidence": f"{int(confidence * 100)}% (Dynamic Detection)"
                    })
                
                # Indirect HTTP calls: session.get, client.post, etc.
                elif (isinstance(func_obj, ast.Name) and 
                      func_obj.id in {"session", "client", "app"}):
                    method = node.func.attr
                    if method.lower() in {"get", "post", "put", "delete", "patch", "head", "options"}:
                        url = None
                        source = "indirect_call"
                        confidence = 0.70
                        
                        if node.args:
                            url, src_type, conf_boost = extract_url_argument(node.args[0])
                            source = src_type or source
                            confidence = max(confidence - conf_boost, 0.50)
                        
                        calls.append({
                            "type": "OUTBOUND_HTTP",
                            "method": method,
                            "url": url or "unknown",
                            "source": source,
                            "file": file_path,
                            "line": node.lineno,
                            "confidence": f"{int(confidence * 100)}% (Indirect Call Detection)"
                        })
                
                # urllib calls: urllib.request.urlopen, etc.
                elif (isinstance(func_obj, ast.Attribute) and
                      isinstance(func_obj.value, ast.Attribute)):
                    if (hasattr(func_obj.value, "attr") and 
                        "urllib" in str(func_obj.value.attr)):
                        url = None
                        source = "urllib"
                        
                        if node.args:
                            url, src_type, conf_boost = extract_url_argument(node.args[0])
                            source = src_type or source
                        
                        calls.append({
                            "type": "OUTBOUND_HTTP",
                            "method": "urlopen",
                            "url": url or "unknown",
                            "source": source,
                            "file": file_path,
                            "line": node.lineno,
                            "confidence": "85% (urllib Detection)"
                        })
    
    except Exception as e:
        pass
    
    return calls