def make_edge(source, target, integration_type, file, line):
    return {
        "source": source,
        "target": target,
        "type": integration_type,
        "evidence": {
            "file": file,
            "line": line
        }
    }