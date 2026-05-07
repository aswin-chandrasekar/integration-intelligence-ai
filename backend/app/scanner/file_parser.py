import re

def extract_file_ops(file_path):
    file_patterns = [
        (r"\bopen\(", "Native File IO"),
        (r"pd\.read_csv", "Pandas CSV"),
        (r"pd\.read_excel", "Pandas Excel"),
        (r"json\.load", "JSON Data"),
        (r"pathlib", "Path Manipulation")
    ]

    results = []
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            for i, line in enumerate(f, 1):
                for pattern, op_name in file_patterns:
                    if re.search(pattern, line):
                        base_score = 80
                        stripped_line = line.strip()
                        if stripped_line.startswith('#'):
                            base_score = 10
                            match_type = "Comment"
                        elif "import " in line:
                            base_score = 70
                            match_type = "Import Match"
                        else:
                            base_score = 85
                            match_type = "Regex Heuristic"
                            
                        results.append({
                            "type": "FILE",
                            "name": op_name,
                            "line": i,
                            "confidence": f"{base_score}% ({match_type})"
                        })
                        break
    except Exception as e:
        print(f"Error scanning for Files in {file_path}: {e}")

    return results
 