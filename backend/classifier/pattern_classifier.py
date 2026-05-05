def classify_edge(snippet: str) -> str:
    if not snippet:
        return "unknown"

    s = snippet.lower()

    # HTTP calls
    if "requests." in s or "httpx." in s or "http://" in s or "https://" in s:
        return "http_sync"

    # Pub/Sub systems
    if "kafka" in s or "rabbitmq" in s or "publish" in s or "subscribe" in s:
        return "pubsub"

    # File / batch processing
    if ".csv" in s or "open(" in s or "file" in s:
        return "batch_file"

    # Database interactions
    if "select " in s or "insert " in s or "db." in s or "cursor" in s:
        return "database"

    return "unknown"