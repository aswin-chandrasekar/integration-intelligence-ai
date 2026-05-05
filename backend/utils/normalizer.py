import re

def normalize_name(name: str) -> str:
    if not name:
        return "unknown"

    name = name.lower().strip()

    # replace spaces & underscores with hyphen
    name = re.sub(r"[ _]+", "-", name)

    # remove special characters
    name = re.sub(r"[^a-z0-9\-:/\.]", "", name)

    return name