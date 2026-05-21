import uuid

def make_edge(source, target, integration_type, file, line, confidence="95% (Automated Match)"):
    # Determine edge color based on type
    if integration_type == "SYNC_API":
        color = "blue"
    elif integration_type == "PUB_SUB":
        color = "green"
    else:
        color = "orange"
    
    return {
        "id": str(uuid.uuid4()),
        "source": source,
        "target": target,
        "type": integration_type,
        "evidence": f"{file}:{line}",
        "file": file,
        "line": line,
        "confidence": confidence,
        "note": "Detected via static code analysis",
        "color": color
    }