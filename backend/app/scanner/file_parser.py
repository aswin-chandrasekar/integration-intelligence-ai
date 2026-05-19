import re
import ast
from typing import List, Dict, Any, Optional

FILE_PATTERNS = {
    "native_open": {
        "patterns": [r"\bopen\("],
        "name": "Native File IO",
        "risk": "High"
    },
    "pandas_csv": {
        "patterns": [r"pd\.read_csv", r"pandas\.read_csv"],
        "name": "Pandas CSV",
        "risk": "Medium"
    },
    "pandas_excel": {
        "patterns": [r"pd\.read_excel", r"pandas\.read_excel"],
        "name": "Pandas Excel",
        "risk": "Medium"
    },
    "json_load": {
        "patterns": [r"json\.load", r"json\.loads"],
        "name": "JSON Data",
        "risk": "Medium"
    },
    "pathlib": {
        "patterns": [r"pathlib\.Path", r"Path\("],
        "name": "Path Manipulation",
        "risk": "Low"
    },
    "yaml": {
        "patterns": [r"yaml\.load", r"yaml\.safe_load"],
        "name": "YAML Files",
        "risk": "High"
    },
    "pickle": {
        "patterns": [r"pickle\.load", r"pickle\.loads"],
        "name": "Pickle Data",
        "risk": "High"
    },
    "configparser": {
        "patterns": [r"configparser\.ConfigParser", r"ConfigParser\("],
        "name": "Config Files",
        "risk": "Medium"
    }
}

def detect_environment_file_paths(content: str) -> List[Dict[str, Any]]:
    """Detect file paths defined via environment variables."""
    results = []
    
    # Pattern: os.getenv('FILE_PATH') or similar
    env_file_pattern = r"os\.(?:getenv|environ\.get)\(['\"]([A-Z_]*(?:PATH|FILE|DIR|CONFIG)[A-Z_]*)['\"](?:,\s*['\"]([^'\"]*)['\"])?\)"
    
    for match in re.finditer(env_file_pattern, content):
        env_var = match.group(1)
        default_val = match.group(2) or ""
        
        results.append({
            "type": "FILE",
            "config_source": "environment_variable",
            "env_var": env_var,
            "default_path": default_val,
            "confidence": 70
        })
    
    return results


def detect_dynamic_file_operations(tree: ast.AST) -> List[Dict[str, Any]]:
    """Detect indirect file operations through variables and function calls."""
    results = []
    
    for node in ast.walk(tree):
        if isinstance(node, ast.Call):
            # Pattern: file_obj = open(path, mode)
            if isinstance(node.func, ast.Name):
                if node.func.id == "open":
                    results.append({
                        "type": "FILE",
                        "config_source": "dynamic_call",
                        "function": "open",
                        "confidence": 80,
                        "line": node.lineno
                    })
            
            # Pattern: df = pd.read_csv(file_path)
            elif isinstance(node.func, ast.Attribute):
                method = node.func.attr
                if method in {"read_csv", "read_excel", "read_json", "read_parquet"}:
                    if isinstance(node.func.value, ast.Name):
                        results.append({
                            "type": "FILE",
                            "config_source": "dynamic_call",
                            "method": method,
                            "library": node.func.value.id,
                            "confidence": 75,
                            "line": node.lineno
                        })
                
                # Pattern: Path.open(), Path.read_text(), etc.
                elif method in {"open", "read_text", "read_bytes", "write_text", "write_bytes"}:
                    results.append({
                        "type": "FILE",
                        "config_source": "dynamic_call",
                        "method": method,
                        "confidence": 70,
                        "line": node.lineno
                    })
    
    return results


def detect_config_based_files(file_path: str) -> List[Dict[str, Any]]:
    """Detect file paths/operations from configuration dictionaries."""
    results = []
    
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Pattern: CONFIG = {...} with file paths
        config_pattern = r"(?:CONFIG|SETTINGS|APP_CONFIG)\s*=\s*\{[\s\S]*?\}"
        
        for match in re.finditer(config_pattern, content):
            config_block = match.group(0)
            
            # Look for file-related keywords
            if re.search(r"(?:path|file|dir|folder|location|source|dest)", config_block, re.IGNORECASE):
                results.append({
                    "type": "FILE",
                    "config_source": "config_dict",
                    "confidence": 65
                })
                break
        
        # Pattern: FILE_PATH = "..." or DATA_DIR = "..."
        path_pattern = r"(?:[A-Z_]*(?:PATH|FILE|DIR|CONFIG)[A-Z_]*)\s*=\s*['\"]([^'\"]*)['\"]"
        matches = list(re.finditer(path_pattern, content))
        if matches:
            results.append({
                "type": "FILE",
                "config_source": "config_constant",
                "count": len(matches),
                "confidence": 75
            })
            
            # Extract individual paths
            for m in matches[:3]:  # Limit to first 3
                results.append({
                    "type": "FILE",
                    "config_source": "path_constant",
                    "path": m.group(1),
                    "confidence": 70
                })
    
    except Exception:
        pass
    
    return results


def detect_indirect_file_references(content: str) -> List[Dict[str, Any]]:
    """Detect indirect file references through string composition."""
    results = []
    
    # Pattern: base_dir + "/config.json"
    concat_pattern = r"(\w+)\s*\+\s*['\"]([^'\"]*)['\"]"
    for match in re.finditer(concat_pattern, content):
        var_name = match.group(1)
        path_part = match.group(2)
        
        if any(ext in path_part for ext in ['.txt', '.csv', '.json', '.yaml', '.yml', '.conf', '.cfg']):
            results.append({
                "type": "FILE",
                "config_source": "concatenation",
                "variable": var_name,
                "path_component": path_part,
                "confidence": 60
            })
    
    # Pattern: f"/data/{version}/file.json"
    fstring_pattern = r"f['\"]([^'\"]*{[^}]*}[^'\"]*)['\"]"
    for match in re.finditer(fstring_pattern, content):
        path_template = match.group(1)
        results.append({
            "type": "FILE",
            "config_source": "f_string",
            "path_template": path_template,
            "confidence": 55
        })
    
    return results


def extract_file_ops(file_path: str) -> List[Dict[str, Any]]:
    """
    Extract file operations with improved detection for indirect operations,
    environment-based paths, and dynamic file handling.
    """
    results = []
    
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        tree = None
        try:
            tree = ast.parse(content)
        except:
            tree = None
        
        # Scan for direct regex patterns
        for i, line in enumerate(content.split('\n'), 1):
            stripped_line = line.strip()
            
            # Skip comments
            if stripped_line.startswith('#'):
                continue
            
            matched = False
            for file_key, file_info in FILE_PATTERNS.items():
                for pattern in file_info["patterns"]:
                    if re.search(pattern, line):
                        base_score = 80
                        match_type = "Direct Match"
                        
                        if "import " in line:
                            base_score = 70
                            match_type = "Import"
                        else:
                            base_score = 85
                            match_type = "Usage"
                        
                        results.append({
                            "type": "FILE",
                            "name": file_info["name"],
                            "risk": file_info["risk"],
                            "detection": match_type,
                            "file": file_path,
                            "line": i,
                            "confidence": f"{base_score}% (Pattern Match)"
                        })
                        matched = True
                        break
                
                if matched:
                    break
        
        # Detect environment variable file paths
        env_paths = detect_environment_file_paths(content)
        for env_path in env_paths:
            results.append({
                "type": "FILE",
                "name": env_path.get("env_var", "File Operation"),
                "detection": "Environment Path",
                "env_var": env_path.get("env_var"),
                "file": file_path,
                "line": 0,
                "confidence": f"{env_path['confidence']}% (Environment Variable Detection)"
            })
        
        # Detect dynamic file operations if AST available
        if tree:
            dynamic_ops = detect_dynamic_file_operations(tree)
            for op in dynamic_ops:
                results.append({
                    "type": "FILE",
                    "name": op.get("method") or op.get("function") or "File Operation",
                    "detection": "Dynamic Operation",
                    "method": op.get("method") or op.get("function"),
                    "file": file_path,
                    "line": op.get("line", 0),
                    "confidence": f"{op['confidence']}% (Dynamic Call Detection)"
                })
        
        # Detect config-based file definitions
        config_files = detect_config_based_files(file_path)
        for config in config_files:
            results.append({
                "type": "FILE",
                "name": config.get("config_source", "Config File"),
                "detection": "Config-Based",
                "file": file_path,
                "line": 0,
                "confidence": f"{config['confidence']}% (Config Detection)"
            })
        
        # Detect indirect file references
        indirect_refs = detect_indirect_file_references(content)
        for ref in indirect_refs:
            results.append({
                "type": "FILE",
                "name": ref.get("path_component") or ref.get("path_template") or ref.get("config_source") or "Indirect File",
                "detection": "Indirect Reference",
                "reference_type": ref.get("config_source"),
                "file": file_path,
                "line": 0,
                "confidence": f"{ref['confidence']}% (Indirect Reference Detection)"
            })
    
    except Exception as e:
        pass
    
    return results
 