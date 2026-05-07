import re

def extract_db_calls(file_path):
    db_patterns = [
        (r"sqlalchemy", "SQLAlchemy"),
        (r"sqlite3\.connect", "SQLite"),
        (r"pymongo\.MongoClient", "MongoDB"),
        (r"psycopg2\.connect", "PostgreSQL"),
        (r"mysql\.connector", "MySQL"),
        (r"db\.session", "Database Session")
    ]

    results = []
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            for i, line in enumerate(f, 1):
                for pattern, db_name in db_patterns:
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
                            "type": "DB",
                            "name": db_name,
                            "line": i,
                            "confidence": f"{base_score}% ({match_type})"
                        })
                        break
    except Exception as e:
        print(f"Error scanning for DB in {file_path}: {e}")

    return results
 