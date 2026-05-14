# Integration-Intelligence-AI

AI-powered Integration Intelligence and Architecture Analysis platform for scanning repositories, detecting system integrations, generating dependency graphs, performing impact analysis, and identifying architectural risks.

---

# Overview

Integration-Intelligence-AI is a static code analysis platform inspired by enterprise architecture intelligence tools like CAST.

The platform scans Python repositories and automatically detects:

- Inbound Flask APIs
- Outbound HTTP integrations
- Database dependencies
- File-based integrations
- System coupling
- Architectural risks
- Dependency impact paths

The application builds a graph representation of integrations and exposes analytics APIs for:

- Impact analysis
- Risk scoring
- Modernization recommendations
- Architecture insights
- Graph visualization

---

# Architecture Overview

```text
Repository Source Code
        ↓
Static Code Scanner
        ↓
Integration Detection
        ↓
Edge Generation
        ↓
Graph Persistence (SQLite)
        ↓
Classification Engine
        ↓
Risk & Impact Analysis
        ↓
REST APIs
        ↓
Frontend Visualization
```

---

# Technology Stack

| Layer             | Technology         |
| ----------------- | ------------------ |
| Backend Framework | Flask              |
| Database          | SQLite             |
| ORM               | SQLAlchemy         |
| Static Analysis   | Python AST + Regex |
| API Communication | REST APIs          |
| Language          | Python 3           |

---

# Features

## Repository Scanning

- Scans Python repositories recursively
- Detects integration points automatically

---

## Integration Detection

Detects:

- Flask routes
- HTTP calls
- Database access
- File operations

---

## Dependency Graph Generation

Builds:

- System nodes
- Integration edges
- Dependency relationships

---

## Impact Analysis

Supports:

- Upstream traversal
- Downstream traversal
- Dependency depth analysis

---

## Risk Analysis

Calculates:

- Fan-in
- Fan-out
- Sync chain depth
- Centrality risk

---

## Recommendation Engine

Generates modernization suggestions:

- Reduce tight coupling
- Adopt async messaging
- Isolate orchestration layers
- Replace file integrations

---

# Project Structure

```text
backend/
│
├── app/
│   ├── api.py
│   ├── main.py
│   ├── scanner/
│   └── models/
│
├── classifier/
├── db/
├── impact/
├── data/
├── utils/
└── requirements.txt
```

---

# Prerequisites

Install the following before running the application:

| Software | Version           |
| -------- | ----------------- |
| Python   | 3.10+ recommended |
| Git      | Latest            |
| pip      | Latest            |

---

# Installation Guide

## Step 1 — Clone the Repository

```bash
git clone <your-repository-url>
```

Example:

```bash
git clone https://github.com/your-org/Integration-Intelligence-AI.git
```

---

## Step 2 — Navigate to Project Folder

```bash
cd Integration-Intelligence-AI
```

---

## Step 3 — Create Virtual Environment

### Windows

```bash
python -m venv venv
```

Activate:

```bash
venv\Scripts\activate
```

### macOS/Linux

```bash
python3 -m venv venv
```

Activate:

```bash
source venv/bin/activate
```

---

## Step 4 — Install Dependencies

```bash
pip install -r backend/requirements.txt
```

Installed packages:

- Flask
- requests
- python-dotenv
- SQLAlchemy

---

## Running the Application Locally

The application only requires starting the backend and frontend servers.

---

# Step 1 — Start Backend Server

Open a terminal:

```bash
cd backend
python -m backend.app.main
```

Expected output:

```text
* Running on http://127.0.0.1:5000
```

Backend server now runs locally.

---

# Step 2 — Start Frontend Server

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend development server will start and provide a local URL similar to:

```text
http://localhost:5173
```

Open the URL in your browser.

---

# Application Workflow


Run:

```bash
python -m backend.app.main
```

Expected output:

```text
* Running on http://127.0.0.1:5000
```

Backend server now runs locally.

---

# Application Workflow

```text
Scan Repository
      ↓
Generate edges.json
      ↓
Load Graph into Database
      ↓
Run Classification
      ↓
Perform Risk & Impact Analysis
```

---

# How to Use the Application

# 1. Scan a Repository

## Endpoint

```http
POST /api/scan
```

## Example Request

Using Postman or curl:

```bash
curl -X POST http://127.0.0.1:5000/api/scan \
-H "Content-Type: application/json" \
-d "{\"repo_path\":\"C:/Projects/sample-repo\"}"
```

---

## GitHub Repository Scan

You can also scan GitHub repositories directly:

```json
{
  "repo_path": "https://github.com/user/repository.git"
}
```

The application:

- Clones repository
- Scans files
- Detects integrations

---

# 2. View Generated Edges

## Endpoint

```http
GET /api/edges
```

## Purpose

Returns detected integration graph.

## Example Response

```json
[
  {
    "source": "Flask App",
    "target": "PostgreSQL",
    "type": "DB"
  }
]
```

---

# 3. Load Graph into Database

Run:

```bash
python -m backend.db.load_edges
```

Purpose:

- Imports `edges.json`
- Creates nodes/edges
- Stores evidence

---

# 4. Run Classification Engine

Run:

```bash
python -m backend.classifier.run_classification
```

Purpose:

- Classifies integration patterns
- Labels edges
- Enriches graph semantics

---

# 5. Perform Impact Analysis

## Endpoint

```http
GET /api/impact
```

## Example

```bash
curl "http://127.0.0.1:5000/api/impact?node=flask-app&depth=2&direction=both"
```

## Parameters

| Parameter | Meaning                  |
| --------- | ------------------------ |
| node      | Starting system          |
| depth     | Traversal depth          |
| direction | upstream/downstream/both |

---

# 6. Risk Analysis

## Endpoint

```http
GET /api/risk-analysis
```

## Purpose

Returns:

- Risk scores
- Centrality
- Sync depth
- Fan-in/Fan-out metrics

---

# 7. Recommendations

## Endpoint

```http
GET /api/recommendations
```

## Purpose

Generates architecture modernization recommendations.

---

# 8. Architecture Summary

## Endpoint

```http
GET /api/architect-summary
```

## Provides

- Total systems
- Integration count
- Coupling hotspots
- Operational risk summary

---

# 9. Export Mermaid Diagram

## Endpoint

```http
GET /api/export/mermaid
```

## Purpose

Exports architecture graph as Mermaid diagram syntax.

## Example Response

```text
graph TD
    "Flask App" -->|SYNC_API| "External Service"
```

---

# Example End-to-End Execution

## 1. Start Backend

```bash
python -m backend.app.main
```

## 2. Scan Repository

```bash
curl -X POST http://127.0.0.1:5000/api/scan \
-H "Content-Type: application/json" \
-d "{\"repo_path\":\"sample-repo\"}"
```

## 3. Load Graph

```bash
python -m backend.db.load_edges
```

## 4. Run Classification

```bash
python -m backend.classifier.run_classification
```

## 5. View Risks

```bash
curl http://127.0.0.1:5000/api/risk-analysis
```

---

# Output Files

| File             | Purpose               |
| ---------------- | --------------------- |
| `edges.json`     | Raw scanned graph     |
| `integration.db` | SQLite graph database |

---

# Key Concepts Used

| Concept                   | Meaning                         |
| ------------------------- | ------------------------------- |
| Static Analysis           | Analyze code without execution  |
| Dependency Graph          | System relationship mapping     |
| Impact Analysis           | Dependency traversal            |
| Fan-In/Fan-Out            | Coupling metrics                |
| Semantic Classification   | Integration categorization      |
| Architecture Intelligence | Automated architecture analysis |

---

# Current Detection Support

## Supported

- Flask routes
- requests/httpx calls
- SQLAlchemy
- SQLite
- MongoDB
- PostgreSQL
- MySQL
- File operations

---

## Current Limitations

- Python-focused scanning
- Heuristic/rule-based classification
- No runtime tracing
- No distributed tracing
- Limited semantic understanding

---

# Future Improvements

Potential roadmap:

- Graph database support (Neo4j)
- AI-based semantic classification
- Multi-language scanning
- Kubernetes topology analysis
- CI/CD integration
- Real-time architecture monitoring
- LLM-powered recommendations

---

# Troubleshooting

# Module Not Found Error

Install dependencies again:

```bash
pip install -r backend/requirements.txt
```

---

# Database Not Created

Run:

```bash
python -m backend.db.init_db
```

---

# Empty Scan Results

Verify:

- Repository path is correct
- Repository contains `.py` files

---

# Port Already In Use

Change Flask port in `main.py`:

```python
app.run(debug=True, port=5001)
```

---

# Recommended Development Workflow

```text
1. Scan Repository
2. Generate edges.json
3. Load Database
4. Run Classification
5. Perform Analysis
6. Visualize Results
```

---

#

