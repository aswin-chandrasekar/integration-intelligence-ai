import json
with open("backend/data/edges.json") as f:
    edges = json.load(f)

seen = set()
duplicates = []
for edge in edges:
    key = (edge["source"], edge["target"], edge["type"], edge["file"], edge["line"])
    if key in seen:
        duplicates.append(edge)
    else:
        seen.add(key)

print("Duplicates count:", len(duplicates))
if duplicates:
    print("First duplicate:", duplicates[0])