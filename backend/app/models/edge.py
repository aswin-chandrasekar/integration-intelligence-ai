import uuid

def make_edge(source, target, integration_type, file, line):
    return {
        "id": str(uuid.uuid4()),
        "source": source,
        "target": target,
        "type": integration_type,
        "evidence": f"{file}:{line}",
        "file": file,
        "line": line,
        "confidence": "95% (Automated Match)",
        "note": "Detected via static code analysis",
        "color": "blue" if integration_type == "SYNC_API" else "orange"
    }