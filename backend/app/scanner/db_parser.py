import re
import ast
from typing import List, Dict, Any, Optional

DB_PATTERNS = {
    "sqlalchemy": {
        "patterns": [r"sqlalchemy", r"SQLAlchemy", r"create_engine", r"db\.session"],
        "name": "SQLAlchemy",
        "risk": "High"
    },
    "sqlite3": {
        "patterns": [r"sqlite3\.connect", r"sqlite3\.open"],
        "name": "SQLite",
        "risk": "Medium"
    },
    "pymongo": {
        "patterns": [r"pymongo\.MongoClient", r"MongoClient", r"db\["],
        "name": "MongoDB",
        "risk": "High"
    },
    "psycopg2": {
        "patterns": [r"psycopg2\.connect", r"psycopg2\.open"],
        "name": "PostgreSQL",
        "risk": "High"
    },
    "mysql": {
        "patterns": [r"mysql\.connector", r"MySQLdb\.connect"],
        "name": "MySQL",
        "risk": "High"
    },
    "redis": {
        "patterns": [r"redis\.Redis", r"redis\.from_url", r"redis\.StrictRedis"],
        "name": "Redis",
        "risk": "Medium"
    },
    "cassandra": {
        "patterns": [r"cassandra\.cluster", r"Cluster\("],
        "name": "Cassandra",
        "risk": "High"
    }
}

def detect_environment_db_config(content: str) -> List[Dict[str, Any]]:
    """Detect database configurations using environment variables."""
    results = []

    # Pattern: os.getenv('DATABASE_URL') or similar
    env_db_pattern = r"os\.(?:getenv|environ\.get)\(['\"]([A-Z_]*DB[A-Z_]*|DATABASE[A-Z_]*)['\"](?:,\s*['\"]([^'\"]*)['\"])?\)"

    for match in re.finditer(env_db_pattern, content):
        env_var = match.group(1)
        default_val = match.group(2) or ""
        line_no = content[:match.start()].count('\n') + 1

        # Try to infer database type from default value
        db_type = "Unknown"
        if "postgres" in default_val.lower() or "postgresql" in default_val.lower():
            db_type = "PostgreSQL"
        elif "mysql" in default_val.lower():
            db_type = "MySQL"
        elif "mongodb" in default_val.lower() or "mongo" in default_val.lower():
            db_type = "MongoDB"
        elif "sqlite" in default_val.lower():
            db_type = "SQLite"
        elif "redis" in default_val.lower():
            db_type = "Redis"

        results.append({
            "type": "DB",
            "config_source": "environment_variable",
            "env_var": env_var,
            "db_type": db_type,
            "confidence": 70,
            "line": line_no
        })

    return results


def detect_dynamic_db_connections(tree: ast.AST) -> List[Dict[str, Any]]:
    """Detect indirect database connections through variables and function calls."""
    results = []

    for node in ast.walk(tree):
        if isinstance(node, ast.Call):
            # Pattern: engine = create_engine(db_url)
            if isinstance(node.func, ast.Name):
                if node.func.id in {"create_engine", "connect", "from_url"}:
                    results.append({
                        "type": "DB",
                        "config_source": "dynamic_call",
                        "function": node.func.id,
                        "confidence": 65,
                        "line": node.lineno
                    })

            # Pattern: db = database.Database(url)
            elif isinstance(node.func, ast.Attribute):
                method = node.func.attr
                if method in {"connect", "from_url", "create_engine"}:
                    if isinstance(node.func.value, ast.Name):
                        results.append({
                            "type": "DB",
                            "config_source": "dynamic_call",
                            "method": method,
                            "object": node.func.value.id,
                            "confidence": 60,
                            "line": node.lineno
                        })

    return results


def detect_config_based_db(file_path: str) -> List[Dict[str, Any]]:
    """Detect database configurations from config files or config dictionaries."""
    results = []

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Pattern: DATABASES = {...}
        config_pattern = r"DATABASES?\s*=\s*\{[\s\S]*?\}"

        for match in re.finditer(config_pattern, content):
            config_block = match.group(0)
            line_no = content[:match.start()].count('\n') + 1

            # Check for database type hints in config
            if "ENGINE" in config_block or "driver" in config_block.lower():
                results.append({
                    "type": "DB",
                    "config_source": "config_dict",
                    "confidence": 75,
                    "line": line_no
                })
                break

        # Pattern: DATABASE_URL = "..."
        url_pattern = r"DATABASE_URL\s*=\s*['\"]([^'\"]*)['\"]"
        for match in re.finditer(url_pattern, content):
            line_no = content[:match.start()].count('\n') + 1
            results.append({
                "type": "DB",
                "config_source": "config_url",
                "confidence": 80,
                "line": line_no
            })

    except Exception:
        pass

    return results


def extract_db_calls(file_path: str) -> List[Dict[str, Any]]:
    """
    Extract database calls with improved detection for indirect connections,
    environment-based configurations, and dynamic connection patterns.
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
            for db_key, db_info in DB_PATTERNS.items():
                for pattern in db_info["patterns"]:
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
                            "type": "DB",
                            "name": db_info["name"],
                            "risk": db_info["risk"],
                            "detection": match_type,
                            "file": file_path,
                            "line": i,
                            "confidence": f"{base_score}% (Pattern Match)"
                        })
                        matched = True
                        break

                if matched:
                    break

        # Detect environment variable configurations
        if tree:
            env_configs = detect_environment_db_config(content)
            for config in env_configs:
                results.append({
                    "type": "DB",
                    "name": config["db_type"],
                    "detection": "Environment Config",
                    "env_var": config.get("env_var"),
                    "file": file_path,
                    "line": config.get("line", 0),
                    "confidence": f"{config['confidence']}% (Environment Variable Detection)"
                })

            # Detect dynamic connections
            dynamic_conns = detect_dynamic_db_connections(tree)
            for conn in dynamic_conns:
                results.append({
                    "type": "DB",
                    "name": conn.get("db_type") or conn.get("function") or conn.get("method") or "Database",
                    "detection": "Dynamic Connection",
                    "method": conn.get("method") or conn.get("function"),
                    "file": file_path,
                    "line": conn.get("line", 0),
                    "confidence": f"{conn['confidence']}% (Dynamic Call Detection)"
                })

        # Detect config-based databases
        config_dbs = detect_config_based_db(file_path)
        for config in config_dbs:
            results.append({
                "type": "DB",
                "name": config.get("db_type", "Database"),
                "detection": "Config-Based",
                "file": file_path,
                "line": config.get("line", 0),
                "confidence": f"{config['confidence']}% (Config Detection)"
            })

    except Exception as e:
        pass

    return results
 