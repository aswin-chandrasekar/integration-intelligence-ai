import re
import ast
from typing import List, Dict, Any, Optional

PUB_SUB_PATTERNS = {
    "kafka": {
        "patterns": [
            r"KafkaProducer", r"KafkaConsumer", r"kafka\.KafkaProducer", 
            r"kafka\.KafkaConsumer", r"confluent_kafka", r"from_config",
            r"send_and_wait", r"\.send\(", r"\.poll\("
        ],
        "name": "Kafka",
        "risk": "High",
        "libraries": ["kafka-python", "confluent-kafka", "aiokafka"]
    },
    "rabbitmq": {
        "patterns": [
            r"pika\.BlockingConnection", r"pika\.Connection", 
            r"amqp://", r"rabbitpy", r"channel\.basic_publish",
            r"channel\.basic_consume", r"amqpstorm"
        ],
        "name": "RabbitMQ",
        "risk": "High",
        "libraries": ["pika", "rabbitpy", "amqpstorm"]
    },
    "celery": {
        "patterns": [
            r"celery\.Celery", r"Celery\(", r"@.*\.task", r"\.delay\(",
            r"\.apply_async", r"celery_app", r"shared_task", r"from celery import",
            r"celery\.current_app"
        ],
        "name": "Celery",
        "risk": "Medium",
        "libraries": ["celery", "flower"]
    },
    "redis_pubsub": {
        "patterns": [
            r"redis\.Redis.*subscribe", r"\.subscribe\(", r"\.publish\(",
            r"pubsub\s*=", r"redis\.pubsub"
        ],
        "name": "Redis Pub/Sub",
        "risk": "Medium",
        "libraries": ["redis"]
    },
    "nats": {
        "patterns": [
            r"nats\.connect", r"nats\.client", r"await nc\.connect",
            r"\.subscribe\(", r"\.publish\("
        ],
        "name": "NATS",
        "risk": "Medium",
        "libraries": ["nats-py", "asyncio-nats"]
    },
    "mqtt": {
        "patterns": [
            r"paho\.mqtt", r"mqtt\.Client", r"\.connect\(", r"\.subscribe\(",
            r"on_message"
        ],
        "name": "MQTT",
        "risk": "Medium",
        "libraries": ["paho-mqtt"]
    }
}


def detect_environment_pubsub_config(content: str) -> List[Dict[str, Any]]:
    """Detect pub/sub configurations using environment variables."""
    results = []

    # Pattern: os.getenv('KAFKA_*, RABBITMQ_*, REDIS_*, CELERY_*') or similar
    env_pubsub_pattern = r"os\.(?:getenv|environ\.get)\(['\"]([A-Z_]*(?:KAFKA|RABBITMQ|CELERY|REDIS|NATS|MQTT)[A-Z_]*)['\"](?:,\s*['\"]([^'\"]*)['\"])?\)"

    for match in re.finditer(env_pubsub_pattern, content):
        env_var = match.group(1)
        default_val = match.group(2) or ""
        line_no = content[:match.start()].count('\n') + 1

        # Determine system type from env var name
        system_type = "Unknown Pub/Sub"
        if "KAFKA" in env_var:
            system_type = "Kafka"
        elif "RABBITMQ" in env_var or "RABBIT" in env_var:
            system_type = "RabbitMQ"
        elif "CELERY" in env_var:
            system_type = "Celery"
        elif "REDIS" in env_var:
            system_type = "Redis Pub/Sub"
        elif "NATS" in env_var:
            system_type = "NATS"
        elif "MQTT" in env_var:
            system_type = "MQTT"

        results.append({
            "type": "PUB_SUB",
            "system": system_type,
            "config_source": "environment_variable",
            "env_var": env_var,
            "default_val": default_val,
            "confidence": 75,
            "line": line_no
        })

    return results


def detect_import_based_pubsub(tree: ast.AST) -> List[Dict[str, Any]]:
    """Detect pub/sub systems through import statements."""
    results = []

    for node in ast.walk(tree):
        if isinstance(node, ast.ImportFrom):
            if node.module:
                module = node.module.lower()
                
                # Kafka imports
                if "kafka" in module:
                    results.append({
                        "type": "PUB_SUB",
                        "system": "Kafka",
                        "config_source": "import_statement",
                        "module": node.module,
                        "confidence": 80,
                        "line": node.lineno
                    })
                
                # RabbitMQ/Pika imports
                elif "pika" in module or "rabbitpy" in module or "amqpstorm" in module:
                    system_name = "RabbitMQ"
                    if "rabbitpy" in module:
                        system_name = "RabbitMQ (rabbitpy)"
                    elif "amqpstorm" in module:
                        system_name = "RabbitMQ (amqpstorm)"
                    
                    results.append({
                        "type": "PUB_SUB",
                        "system": system_name,
                        "config_source": "import_statement",
                        "module": node.module,
                        "confidence": 85,
                        "line": node.lineno
                    })
                
                # Celery imports
                elif "celery" in module:
                    results.append({
                        "type": "PUB_SUB",
                        "system": "Celery",
                        "config_source": "import_statement",
                        "module": node.module,
                        "confidence": 90,
                        "line": node.lineno
                    })
                
                # Redis Pub/Sub
                elif "redis" in module:
                    results.append({
                        "type": "PUB_SUB",
                        "system": "Redis Pub/Sub",
                        "config_source": "import_statement",
                        "module": node.module,
                        "confidence": 70,
                        "line": node.lineno
                    })
                
                # NATS
                elif "nats" in module:
                    results.append({
                        "type": "PUB_SUB",
                        "system": "NATS",
                        "config_source": "import_statement",
                        "module": node.module,
                        "confidence": 85,
                        "line": node.lineno
                    })
                
                # MQTT
                elif "paho" in module or "mqtt" in module:
                    results.append({
                        "type": "PUB_SUB",
                        "system": "MQTT",
                        "config_source": "import_statement",
                        "module": node.module,
                        "confidence": 85,
                        "line": node.lineno
                    })

        # Also check regular imports (import kafka, import celery, etc.)
        elif isinstance(node, ast.Import):
            for alias in node.names:
                module = alias.name.lower()
                
                if "kafka" in module:
                    results.append({
                        "type": "PUB_SUB",
                        "system": "Kafka",
                        "config_source": "import_statement",
                        "module": alias.name,
                        "confidence": 80,
                        "line": node.lineno
                    })
                elif "pika" in module:
                    results.append({
                        "type": "PUB_SUB",
                        "system": "RabbitMQ",
                        "config_source": "import_statement",
                        "module": alias.name,
                        "confidence": 85,
                        "line": node.lineno
                    })
                elif "celery" in module:
                    results.append({
                        "type": "PUB_SUB",
                        "system": "Celery",
                        "config_source": "import_statement",
                        "module": alias.name,
                        "confidence": 90,
                        "line": node.lineno
                    })
                elif "redis" in module:
                    results.append({
                        "type": "PUB_SUB",
                        "system": "Redis Pub/Sub",
                        "config_source": "import_statement",
                        "module": alias.name,
                        "confidence": 70,
                        "line": node.lineno
                    })
                elif "nats" in module:
                    results.append({
                        "type": "PUB_SUB",
                        "system": "NATS",
                        "config_source": "import_statement",
                        "module": alias.name,
                        "confidence": 85,
                        "line": node.lineno
                    })
                elif "mqtt" in module or "paho" in module:
                    results.append({
                        "type": "PUB_SUB",
                        "system": "MQTT",
                        "config_source": "import_statement",
                        "module": alias.name,
                        "confidence": 85,
                        "line": node.lineno
                    })

    return results


def detect_dynamic_pubsub_usage(tree: ast.AST, content: str) -> List[Dict[str, Any]]:
    """Detect pub/sub usage through function calls and patterns."""
    results = []

    for pattern_key, pattern_config in PUB_SUB_PATTERNS.items():
        system_name = pattern_config["name"]
        patterns = pattern_config["patterns"]
        
        for pattern in patterns:
            try:
                for match in re.finditer(pattern, content):
                    line_no = content[:match.start()].count('\n') + 1
                    
                    # Avoid duplicates by checking if same system/line already exists
                    existing = [r for r in results if r.get("system") == system_name and r.get("line") == line_no]
                    if not existing:
                        results.append({
                            "type": "PUB_SUB",
                            "system": system_name,
                            "config_source": "pattern_match",
                            "pattern": pattern,
                            "confidence": 65,
                            "line": line_no
                        })
            except Exception:
                pass

    return results


def detect_celery_decorators(tree: ast.AST) -> List[Dict[str, Any]]:
    """Detect Celery tasks through @task decorators."""
    results = []

    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef):
            for decorator in node.decorator_list:
                # @task pattern
                if isinstance(decorator, ast.Call):
                    if isinstance(decorator.func, ast.Name):
                        if decorator.func.id == "task":
                            results.append({
                                "type": "PUB_SUB",
                                "system": "Celery",
                                "config_source": "celery_task_decorator",
                                "function": node.name,
                                "confidence": 95,
                                "line": node.lineno
                            })
                    elif isinstance(decorator.func, ast.Attribute):
                        if decorator.func.attr == "task":
                            results.append({
                                "type": "PUB_SUB",
                                "system": "Celery",
                                "config_source": "celery_task_decorator",
                                "function": node.name,
                                "confidence": 95,
                                "line": node.lineno
                            })
                
                # @shared_task pattern
                elif isinstance(decorator, ast.Name):
                    if decorator.id == "shared_task":
                        results.append({
                            "type": "PUB_SUB",
                            "system": "Celery",
                            "config_source": "celery_shared_task",
                            "function": node.name,
                            "confidence": 95,
                            "line": node.lineno
                        })

    return results


def extract_pub_sub_systems(file_path: str) -> List[Dict[str, Any]]:
    """
    Main function to extract pub/sub system detections from a Python file.
    Returns list of detected pub/sub integrations with confidence scores.
    """
    systems = []
    
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            tree = ast.parse(content)

        # 1. Detect via environment variables
        env_configs = detect_environment_pubsub_config(content)
        systems.extend(env_configs)

        # 2. Detect via import statements
        import_based = detect_import_based_pubsub(tree)
        systems.extend(import_based)

        # 3. Detect via dynamic usage patterns
        dynamic_usage = detect_dynamic_pubsub_usage(tree, content)
        systems.extend(dynamic_usage)

        # 4. Detect Celery decorators (high confidence)
        celery_decorators = detect_celery_decorators(tree)
        systems.extend(celery_decorators)

    except SyntaxError:
        pass
    except Exception:
        pass

    return systems
