# Integration Intelligence AI - Overall Architecture

**Version:** 1.0  
**Last Updated:** May 20, 2026

---

## Executive Summary

**Integration Intelligence AI** is a full-stack system that scans software repositories, detects integration patterns (APIs, databases, file operations), calculates confidence scores, and provides AI-driven architectural insights using Google Gemini LLM.

**Architecture:**
- **Frontend:** React + Vite + TypeScript (Node.js/browser)
- **Backend:** Flask + Python 3.13
- **LLM Integration:** Google Gemini (via google-generativeai SDK)
- **Data Storage:** JSON files (backend/data/edges.json), in-memory caching
- **Scanning:** AST + Regex-based pattern matching on Python source code

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │  ScanPanel   │  │  ResultsTable│  │  GraphView   │            │
│  │  RepoInput   │  │  EdgeList    │  │  Mermaid     │            │
│  │  RunScan     │  │  Sorting     │  │  Filters     │            │
│  └─────┬────────┘  └──────┬───────┘  └──────┬───────┘            │
│        │                  │                  │                    │
│  ┌─────────────────────────────────────────────────┐             │
│  │     ArchitectSummaryPanel   │  RecommendationsPanel         │  │
│  │     AIInsights              │  (LLM-driven)                 │  │
│  └────────────────┬──────────────────────┬──────────┘             │
└─────────────────────────────────────────────────────────────────┘
        │                                    │ 
        │ HTTP (fetch/axios)                │
        ▼                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (Flask Blueprint)                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ API Routes (backend/app/api.py)                          │   │
│  │ ┌─────────────────────────────────────────────────────┐  │   │
│  │ │ POST /api/scan           → Repo Scan & Edge Gen     │  │   │
│  │ │ GET  /api/edges          → Load edges.json          │  │   │
│  │ │ GET  /api/recommendations → LLM Recommendations     │  │   │
│  │ │ GET  /api/architect-summary → LLM Summary          │  │   │
│  │ │ GET  /api/insights       → Risk + Metrics + LLM    │  │   │
│  │ │ GET  /api/risk-analysis  → Heuristic Risk Scores   │  │   │
│  │ │ GET  /api/export/mermaid → Mermaid Diagram         │  │   │
│  │ │ POST /api/llm/explain    → Explain Edge (LLM)      │  │   │
│  │ └─────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ▲              ▲                        │
├────────────────────────────┼──────────────┼────────────────────┤
│  ┌────────────────┐ ┌────────────────┐ ┌──────────────────┐   │
│  │ Scanners       │ │ Classifiers    │ │ LLM Client       │  │
│  │ ───────────    │ │ ──────────     │ │ ──────────       │  │
│  │ flask_parser   │ │ impact.py      │ │ gemini_client.py│  │
│  │ db_parser      │ │ risk_engine.py │ │ (Gemini API)    │  │
│  │ file_parser    │ │ recommendation │ │                  │  │
│  │ outbound_http  │ │  _engine.py    │ │ redact_secrets()│  │
│  │ repo_scanner   │ │                │ │ generate_*()    │  │
│  └────────────────┘ └────────────────┘ └────────┬─────────┘   │
│                                                  │              │
└──────────────────────────────────────────────────┼──────────────┘
                                                   │
                          ┌────────────────────────┘
                          │
        ┌─────────────────▼──────────────┐
        │   Google Gemini API             │
        │   (via google-generativeai)     │
        │   - generate_architect_summary()│
        │   - generate_llm_recommendations│
        │   - explain_edge()              │
        └─────────────────────────────────┘

        ┌─────────────────────────────┐
        │   Data Files                 │
        │   backend/data/edges.json    │
        │   backend/.env (GEMINI_KEY)  │
        └─────────────────────────────┘
```

---

## Page-by-Page UI Workflow

### 1. **Dashboard Page** (DEFAULT VIEW)

#### 1.1 Repository Scan Section
**Location:** `frontend/src/components/ScanPanel.tsx`

**UI Elements:**
- **Input Field:** "Repo Path / Repo URL" 
  - Accepts local path (e.g., `/home/user/my-repo`) or GitHub URL (e.g., `https://github.com/org/repo`)
- **Button:** "Run Scan" (blue, Play icon)
- **Status Indicator:** Shows `Idle`, `Scanning`, `Completed`, or `Error`

**Workflow When User Clicks "Run Scan":**

```
1. UI captures repoPath from input field
2. Call: scanRepository(repoPath)
   └─ HTTP POST /api/scan with { repoPath }
3. Backend processes:
   ▼
   a. If repoPath is GitHub URL:
      - Git clone into data/clones/{repo_name}
      - (Or git pull if already cloned)
   
   b. Scan Python files:
      - Call get_python_files(repo_path) → finds all .py files
   
   c. For each Python file, extract integrations:
      i.   Flask routes → make_edge("External Client", "Flask App", "SYNC_API", file, line, confidence)
      ii.  HTTP calls → make_edge("Flask App", "External Service", "SYNC_API", file, line, confidence)
      iii. DB calls → make_edge("Flask App", "DB", "DB", file, line, confidence)
      iv.  File ops → make_edge("Flask App", "JSON Data/Native File IO", "FILE", file, line, confidence)
   
   d. Deduplicate edges by (source, target, type, file, line), keeping highest confidence
   
   e. Save to backend/data/edges.json
   
   f. Return { "status": "completed", "edges": <count> }

4. UI polls GET /api/status every 2 seconds to check scan completion
5. When complete, UI auto-loads integrations via getIntegrations()
```

**Data Flow:**
```
User Input → ScanPanel.tsx → /api/scan → Backend Scanners → Dedupe → edges.json → Response
```

---

#### 1.2 Integrations Graph Section
**Location:** `frontend/src/components/GraphView.tsx`

**UI Elements:**
- **Mermaid Graph Visualization:** Interactive nodes (systems) and edges (integrations)
- **Filter Dropdown:** Filter by integration type (SYNC_API, DB, FILE)
- **Export Button (Mermaid):** Downloads architecture as .mmd file

**Workflow When Page Loads:**
```
1. useEffect() → getIntegrations() → GET /api/edges
2. Load edges from backend/data/edges.json
3. Build ReactFlow graph from edges:
   - Each source/target becomes a node
   - Each edge gets a colored connection (SYNC_API=blue, DB=red, FILE=green)
4. Render interactive Mermaid-based graph
5. User can click on edge to see details modal with:
   - Source → Target
   - Type, Evidence, Confidence
6. Button click: export-mermaid → exportMermaid(selectedSystem)
   └─ GET /api/export/mermaid?system=<system_name>
   └─ Backend generates Mermaid syntax and returns as text
   └─ Frontend downloads as .mmd file
```

**Data Source:**
```
Graph Data ← edges.json (from last scan)
```

---

#### 1.3 Results Table Section
**Location:** `frontend/src/components/ResultsTable.tsx`

**UI Elements:**
- **Table Columns:** Source, Target, Type, File, Line, Confidence/Notes
- **Sorting Options:** By Confidence (High→Low or Low→High)
- **Export Buttons:**
  - "Export as JSON" → Download edges as .json
  - "Export as CSV" → Download edges formatted as CSV

**Workflow:**
```
1. Page load → getIntegrations() → GET /api/edges
2. Display all edges in table format
3. User clicks "Confidence (High→Low)":
   - normalizeConfidence() extracts numeric value (e.g., "85%" → 85)
   - Sort edges by confidence descending
4. User clicks "Export as JSON" or "Export as CSV":
   - Frontend-only transformation (no backend call)
   - Create Blob of formatted data
   - Trigger browser download
```

**Data Source:**
```
Table Data ← edges.json (from last scan)
```

---

#### 1.4 Architect Summary Section
**Location:** `frontend/src/components/ArchitectSummaryPanel.tsx`

**UI Elements:**
- **Metrics Cards:** Systems, Integrations, Sync APIs, DB Calls, File Ops
- **Summary Text:** LLM-generated narrative about the architecture
- **Risk Badge:** HIGH / MEDIUM / LOW
- **Most Coupled System:** Highlighted in red box

**Workflow When Page Loads:**
```
1. useEffect() → fetch("/api/architect-summary")
2. Backend handler:
   a. Load edges.json
   b. Calculate system metrics:
      - Total systems = unique(source ∪ target)
      - Total integrations = count(edges)
      - sync_edges = count(edges where type == "SYNC_API")
      - db_edges = count(edges where type == "DB")
      - file_edges = count(edges where type == "FILE")
      - most_coupled = system with max(fan_out + fan_in)
   
   c. Build metrics dict:
      {
        "len(edges)": total_integrations,
        "len(systems)": len(systems),
        "sync_edges": sync_edges,
        "most_coupled": most_coupled_name,
        "max_connections": max_connections,
        "db_edges": db_edges,
        "file_edges": file_edges,
        "overall_risk": risk_level (HIGH if sync_edges >= 10, MEDIUM if >= 5, else LOW)
      }
   
   d. Call LLM: generate_architect_summary(json.dumps(metrics))
      ▼
      LLM Prompt (see section 3.2.1):
      ────────────────────────────────────────
      "You are an Enterprise Software Architect reviewing system metrics.
       Using the following raw integration data and metrics:
       {json_metrics}
       
       Write a professional, rich architecture summary. It should describe:
       1. The size and complexity of the integration landscape
       2. The primary driving communication patterns
       3. The coupling hotspot (most connected system)
       4. An assessment of overall operational risk
       
       Return strictly as JSON with key "summary" (string)."
      ────────────────────────────────────────
      
      LLM Response Parse: JSON → extract "summary" field
   
   e. Return JSON response:
      {
        "summary": "<LLM generated narrative>",
        "systems": count,
        "integrations": count,
        "syncIntegrations": count,
        "dbIntegrations": count,
        "fileIntegrations": count,
        "mostCoupledSystem": name,
        "overallRisk": "HIGH" | "MEDIUM" | "LOW"
      }

3. Frontend renders metrics and LLM summary text
```

**Data Source:**
```
Metrics ← edges.json analysis + LLM generation
```

---

#### 1.5 Recommendations Section
**Location:** `frontend/src/components/RecommendationsPanel.tsx`

**UI Elements:**
- **Recommendation Cards:** Each card shows:
  - Title (e.g., "High Coupling Detected")
  - System Name(s)
  - Severity Badge (LOW / MEDIUM / HIGH / CRITICAL)
  - Why (description)
  - Recommendation (proposed action)
  - Steps (ordered list of actions)

**Workflow When Page Loads:**
```
1. useEffect() → fetch("/api/recommendations")
2. Backend handler:
   a. Load edges.json
   b. Try LLM-first: Call generate_llm_recommendations(json.dumps(edges))
      ▼
      LLM Prompt (see section 3.2.2):
      ────────────────────────────────────────
      "You are a Principal Software Architect.
       Analyze these system integration edges:
       {edges_json}
       
       Generate 2-3 modernization recommendations addressing coupling, risk, technical debt.
       Return strictly as JSON array of objects:
       [
         {
           "system": "system_name",
           "title": "Recommendation Title",
           "severity": "LOW|MEDIUM|HIGH|CRITICAL",
           "why": "Why this matters",
           "recommendation": "Proposed action",
           "steps": ["Step 1", "Step 2", ...]
         }
       ]"
      ────────────────────────────────────────
      
      LLM Response: JSON array → Parse
   
   c. If LLM fails or disabled:
      Fallback to heuristic engine (recommendation_engine.py):
      
      Rule 1: High fan-out systems (fan_out >= 3)
               → Recommend: "High Coupling Detected" (SEVERITY: HIGH)
      
      Rule 2: Excessive sync APIs (count >= 5)
               → Recommend: "Excessive Synchronous APIs" (SEVERITY: MEDIUM)
      
      Rule 3: Direct DB access (any db_edges found)
               → Recommend: "Direct Database Coupling" (SEVERITY: HIGH)
      
      Rule 4: File-based integration (any file_edges found)
               → Recommend: "Legacy File-Based Integration" (SEVERITY: MEDIUM)
   
   d. Return JSON array of recommendations

3. Frontend renders cards sorted by severity
```

**Data Source:**
```
Recommendations ← LLM (primary) OR Heuristic fallback
```

---

### 2. **Insights Page** (SECONDARY VIEW)

**Location:** `frontend/src/components/AIInsights.tsx`

**UI Sections:**

#### 2.1 Metrics Cards
- Total Integrations (count, trend)
- Active Security Risks (count, badge)
- Architecture Score (0-100, progress bar)
- Matching Confidence (0-100%, numeric precision label)

#### 2.2 Confidence Index
- Global Precision (%)
- Data Mapping (%)
- Security Logic (%)
- Latency Prediction (%)

#### 2.3 Detected Patterns
- Event-Driven Synchronization
- Direct SQL Access

#### 2.4 Risks & Recommendations
- Formatted risk list
- Formatted recommendation list

**Workflow When Page Loads:**
```
1. useEffect() → fetch("/api/insights")
2. Backend handler:
   a. Load edges.json
   b. Calculate confidence avg:
      total_confidence = 0
      valid_confidence_count = 0
      For each edge:
         Extract numeric confidence from "XX% (Detection Type)" format
         total_confidence += numeric_value
         valid_confidence_count += 1
      avg_confidence = round(total_confidence / valid_confidence_count)
      
      Example: ["85% (Pattern Match)", "70% (Env Var)", "90% (AST)"]
               → [85, 70, 90] → avg = 81
   
   c. Calculate risk-based metrics:
      risks_analysis = calculate_risk(edges)  ▼ [see section 3.1]
      high_critical_systems = filter(risks where riskLevel in [HIGH, CRITICAL])
      active_risks_count = count(high_critical_systems)
      
      arch_score = 100
      for risk in risks_analysis:
         if riskLevel == CRITICAL: arch_score -= 15
         if riskLevel == HIGH: arch_score -= 10
         if riskLevel == MEDIUM: arch_score -= 5
      arch_score = max(0, min(100, arch_score))
   
   d. Detect patterns:
      has_event_driven = any(edge.type in [PUB_SUB, ASYNC_API])
      sync_count = count(edges where type == SYNC_API)
      
      if has_event_driven OR sync_count < total_integrations * 0.3:
         Add pattern: "Event-Driven Synchronization"
      
      db_count = count(edges where type == DB)
      if db_count > 0:
         Add pattern: "Direct SQL Access" (status: RISK)
   
   e. Format risks for UI:
      For each high_critical_system in top risks:
         {
           "type": "System Coupling Risk",
           "detail": f"System '{name}' has high centrality/sync depth",
           "impact": riskLevel,
           "evidence": f"Fan-Out: {fanOut}, Sync Depth: {syncDepth}",
           "action": "Investigate"
         }
      
      If db_count > 0:
         {
           "type": "Direct Database Access",
           "detail": f"{db_count} direct database connections",
           "impact": "HIGH" if db_count > 3 else "MEDIUM",
           "action": "Implement API abstraction"
         }
   
   f. Format recommendations for UI:
      recs = generate_recommendations(edges)  ▼ [Heuristic fallback]
      OR
      recs = generate_llm_recommendations(edges)  ▼ [LLM-primary]
      
      For each rec in top 3:
         {
           "icon": "Zap" or "AlertCircle",
           "title": rec.title,
           "desc": rec.why + " " + rec.recommendation
         }
   
   g. Calculate confidence index:
      confidenceIndex = {
        "globalPrecision": avg_confidence,
        "dataMapping": min(100, avg_confidence + 5),      // +5 adjustment
        "securityLogic": min(100, max(0, avg_confidence - 2)),  // -2 adjustment
        "latencyPrediction": min(100, avg_confidence + 2)  // +2 adjustment
      }
   
   h. Return full insights JSON:
      {
        "metrics": {
          "totalIntegrations": {...},
          "activeSecurityRisks": {...},
          "architectureScore": {...},
          "matchingConfidence": {...}
        },
        "patterns": [...],
        "confidenceIndex": {...},
        "risks": [...],
        "recommendations": [...]
      }

3. Frontend renders all sections with data
```

**Data Source:**
```
Metrics ← edges.json analysis + risk_engine + LLM generation
```

---

#### 2.2 Help Centre Page
**Location:** `frontend/src/components/HelpCentre.tsx`

Displays static help text and documentation. No backend calls.

---

## Technical Deep Dives

### 3. **Confidence Score Calculation**

#### 3.1 Where Confidence Values Originate

Confidence scores are generated **during the scan phase** by individual scanner modules as they detect integrations. Each detection type has a hardcoded base confidence:

**Flask Routes (flask_parser.py):**
```python
- AST decorator match (@app.route decorated function):           100%
- Indirect route (add_url_rule):                                  85%
- Config-based routes:                                            70%
```

**DB Calls (db_parser.py):**
```python
- Direct pattern match (sqlalchemy, pymongo, etc. in usage):      85%
- Import statement (import sqlalchemy):                           70%
- Pattern match (generic):                                        Base 80%
- Environment DB config (os.getenv("DATABASE_URL")):              70%
- Dynamic connection calls (engine = create_engine(...)):         60-65%
- Config-based DB (DATABASES = {...}):                            75-80%
```

**File Operations (file_parser.py):**
```python
- Direct pattern usage (open(...), pd.read_csv(...)):             85%
- Import statement:                                               70%
- Environment file path (os.getenv("FILE_PATH")):                 70%
- Dynamic file call (file.open(), Path.read_text()):              75-80%
- Config dict (CONFIG = {...}):                                   65%
- Indirect reference (concatenation):                             60%
- F-string path composition:                                      55%
```

**HTTP Calls (outbound_http.py):**
```python
- Literal URL string (requests.get("http://example.com")):        95%
- F-string URL (f"http://{host}:{port}/api"):                     75%
- Concatenated URL (base_url + endpoint):                         70%
- Environment variable URL:                                        65%
- Variable reference (session variable):                          50%
```

#### 3.2 Confidence Score Format

Scores are stored in edge JSON as strings:
```json
"confidence": "85% (Pattern Match)"
"confidence": "100% (AST Route Match)"
"confidence": "70% (Environment Variable Detection)"
"confidence": "60% (Dynamic Call Detection)"
"confidence": "80% (Config Detection)"
"confidence": "55% (Indirect Reference Detection)"
```

**Parsing:** When aggregating for metrics, UI/backend extracts numeric prefix:
```python
match = re.search(r'(\d+)', confidence_str)  # Extracts "85" from "85% (Pattern Match)"
numeric_confidence = int(match.group(1))
```

#### 3.3 Confidence Aggregation (Average)

When calculating overall `matchingConfidence` in `/api/insights`:
```python
total_confidence = 0
valid_count = 0
for edge in edges:
    confidence_str = edge.get("confidence", "")
    match = re.search(r'(\d+)', str(confidence_str))
    if match:
        numeric_val = int(match.group(1))
        total_confidence += numeric_val
        valid_count += 1

avg_confidence = round(total_confidence / valid_count) if valid_count > 0 else 0
```

**Example:**
```
Edges: ["85% (Pattern)", "70% (Env)", "90% (AST)", "65% (Indirect)"]
Numeric: [85, 70, 90, 65]
Average: (85 + 70 + 90 + 65) / 4 = 77.5 → Rounds to 78
```

#### 3.4 Confidence Index Adjustments

The `confidenceIndex` applies heuristic adjustments to the average:
```python
confidenceIndex = {
    "globalPrecision": avg_confidence,                    # e.g., 78
    "dataMapping": min(100, avg_confidence + 5),         # 78 + 5 = 83
    "securityLogic": min(100, max(0, avg_confidence - 2)), # 78 - 2 = 76
    "latencyPrediction": min(100, avg_confidence + 2)    # 78 + 2 = 80
}
```

**Purpose:** Represents different dimensions of confidence:
- `globalPrecision`: Overall detection accuracy
- `dataMapping`: Confidence in correct data flow / API mapping
- `securityLogic`: Confidence in compliance/security aspects
- `latencyPrediction`: Confidence in performance/latency modeling

---

### 4. **LLM Integration Architecture**

#### 4.1 LLM Module Location & Initialization

**File:** `backend/llm/gemini_client.py`

**Initialization:**
```python
from google import genai
from dotenv import load_dotenv

def get_client():
    base_dir = os.path.dirname(os.path.dirname(__file__))
    load_dotenv(os.path.join(base_dir, ".env"))
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return None  # LLM disabled
    return genai.Client(api_key=api_key)

MODELS = [
    "gemini-3.1-flash-lite-preview",
    "gemini-3.1-pro",
    "gemini-3-flash-preview",
    "gemini-2.5-flash",
    "gemini-2.0-flash"
]
```

**Fallback Logic:** Tries models in order; if one fails, tries next model. Includes "models/" prefix retry.

#### 4.2 LLM Integration Points

##### 4.2.1 Architect Summary Generation

**Endpoint:** `GET /api/architect-summary`

**Backend Logic:**
```python
# Load edges and calculate metrics
metrics = {
    "len(edges)": total_integrations,
    "len(systems)": num_systems,
    "sync_edges": sync_count,
    "most_coupled": most_coupled_system,
    "db_edges": db_count,
    "file_edges": file_count,
    "overall_risk": risk_level
}

# Call LLM
result = generate_architect_summary(json.dumps(metrics))
# Returns: {"summary": "LLM generated narrative"}
```

**LLM Function:**
```python
def generate_architect_summary(graph_metrics_json):
    prompt = f"""You are an Enterprise Software Architect reviewing system metrics.
Using the following raw integration data and metrics:
{graph_metrics_json}

Write a professional, rich architecture summary. It should describe:
1. The size and complexity of the integration landscape (total integrations and total systems).
2. The primary driving communication patterns (synchronous integrations, database, and file ops).
3. The coupling hotspot representing the most connected system and its risk.
4. An assessment of overall operational risk based on these metrics.

Rules:
- Do not include recommendations, steps, or suggestions for remediation.
- Do not use bullet points or markdown formatting.
- Make it a single, cohesive narrative paragraph (4-6 sentences).
- Return strictly as JSON with key "summary" (string)."""
    
    response_text = generate_content_with_fallback(prompt, 
                                                    response_mime_type="application/json")
    return json.loads(response_text)
```

**Example Input Metrics:**
```json
{
  "len(edges)": 23,
  "len(systems)": 8,
  "sync_edges": 15,
  "most_coupled": "Flask App",
  "db_edges": 4,
  "file_edges": 2,
  "overall_risk": "HIGH"
}
```

**Example LLM Output:**
```json
{
  "summary": "The system landscape consists of 8 interconnected systems with 23 total integration points, driven primarily by 15 synchronous API communications that create tight temporal coupling. Flask App serves as the central hub with maximum connectivity (fan-in/out combined), creating a single point of failure risk. Four direct database access patterns indicate potential data model coupling violations. With risk score indicating HIGH severity, immediate refactoring toward async messaging patterns and API abstraction layers is recommended."
}
```

**Frontend Display:**
```tsx
// ArchitectSummaryPanel.tsx
<div className="bg-app-bg p-5">
  <p className="text-sm text-app-text leading-7">
    {data.summary}
  </p>
</div>
```

---

##### 4.2.2 LLM Recommendations

**Endpoint:** `GET /api/recommendations`

**Backend Logic:**
```python
edges = load_edges()  # From edges.json

# Try LLM-first
llm_recs = generate_llm_recommendations(json.dumps(edges))
if llm_recs:
    results = llm_recs
else:
    # Fallback to heuristics
    results = generate_recommendations(edges)

return jsonify(results)
```

**LLM Function:**
```python
def generate_llm_recommendations(edges_json):
    client = get_client()
    if not client:
        return []
    
    prompt = f"""You are a Principal Software Architect.
Analyze these system integration edges:
{edges_json}

Generate a list of 2-3 modernization recommendations to address system coupling, risk, and technical debt.
Return strictly as a JSON array of objects. Each object MUST have keys:
- "system" (string, the system name(s) affected)
- "title" (string, recommendation title)
- "severity" (string, either "LOW", "MEDIUM", "HIGH", or "CRITICAL")
- "why" (string, description of why it matters / integration risks)
- "recommendation" (string, the proposed modernization action)
- "steps" (list of strings, actionable steps to implement the recommendation)

Example:
[
  {{
    "system": "auth-service",
    "title": "Loose coupling for notification dispatch",
    "severity": "MEDIUM",
    "why": "Auth-service calls Notification-service synchronously, causing latency risks.",
    "recommendation": "Introduce a messaging queue (RabbitMQ) for async notifications.",
    "steps": ["Setup RabbitMQ broker", "Add worker service", "Convert auth REST call to message publish"]
  }}
]"""
    
    response_text = generate_content_with_fallback(prompt, 
                                                    response_mime_type="application/json")
    return json.loads(response_text)
```

**Example Input Edges (abbreviated):**
```json
[
  {"source":"Flask App", "target":"UserService", "type":"SYNC_API", "confidence":"90%"},
  {"source":"Flask App", "target":"AuthService", "type":"SYNC_API", "confidence":"85%"},
  {"source":"Flask App", "target":"DB", "type":"DB", "confidence":"80%"},
  {"source":"AuthService", "target":"DB", "type":"DB", "confidence":"75%"},
  ...
]
```

**Example LLM Output:**
```json
[
  {
    "system": "Flask App",
    "title": "Reduce synchronous API chains",
    "severity": "HIGH",
    "why": "Flask App synchronously calls multiple downstream services, creating cascading failure risk.",
    "recommendation": "Introduce message queue for non-critical operations (user notifications, analytics).",
    "steps": [
      "Setup RabbitMQ or Kafka cluster",
      "Identify async-safe operations (logging, notifications)",
      "Convert sync calls to message publish",
      "Implement consumer workers"
    ]
  },
  {
    "system": "Flask App, AuthService",
    "title": "Encapsulate database access",
    "severity": "HIGH",
    "why": "Multiple services directly access shared database, breaking service boundaries.",
    "recommendation": "Create database abstraction layer and API-driven data access.",
    "steps": [
      "Create repository layer in each service",
      "Expose READ/WRITE operations via service API",
      "Remove direct cross-service DB access",
      "Implement database-level access control"
    ]
  }
]
```

**Fallback (Heuristic Recommendations):**

If LLM is disabled, `generate_recommendations(edges)` applies deterministic rules:

```python
def generate_recommendations(edges):
    recommendations = []
    
    # Rule 1: High Fan-Out Systems (>= 3)
    for system in systems_with_fan_out >= 3:
        recommendations.append({
            "system": system,
            "title": "High Coupling Detected",
            "severity": "HIGH",
            "why": f"System {system} communicates with 3+ downstream systems...",
            "recommendation": "Introduce API gateway, async messaging, or service boundaries...",
            "steps": [...]
        })
    
    # Rule 2: Excessive Sync APIs (>= 5)
    if sync_edge_count >= 5:
        recommendations.append({
            "system": "Architecture",
            "title": "Excessive Synchronous APIs",
            "severity": "MEDIUM",
            "why": f"{sync_edge_count} synchronous integrations detected...",
            ...
        })
    
    # Rule 3: Direct DB Access
    for system in systems_with_db_access:
        recommendations.append({...})
    
    # Rule 4: File-Based Integration
    if file_edge_count > 0:
        recommendations.append({...})
    
    return recommendations
```

---

##### 4.2.3 Edge Explanation (Detailed Insight)

**Endpoint:** `POST /api/llm/explain` (Future / Optional)

**Frontend Call:**
```typescript
const explainEdge = async (source, target, type, evidence) => {
  const response = await fetch('/api/llm/explain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source, target, type, evidence })
  });
  return response.json();
};
```

**Backend Function:**
```python
@lru_cache(maxsize=128)
def explain_edge(source, target, edge_type, evidence_redacted):
    prompt = f"""You are an expert Software Architect.
Explain the following integration between two systems in 2-3 short sentences.
Source System: {source}
Target System: {target}
Integration Type: {edge_type}
Evidence: {evidence_redacted}

Focus on the architectural purpose and potential risks (e.g., synchronous coupling, database bottlenecks).
Do not use markdown formatting."""
    
    try:
        explanation = generate_content_with_fallback(prompt)
        return explanation
    except Exception as e:
        return f"Explanation currently unavailable ({str(e)})"
```

---

#### 4.3 Secret Redaction for LLM Safety

**Policy:** Do not send raw source code or secrets to external LLMs.

**Implementation in gemini_client.py:**
```python
def redact_secrets(text: str) -> str:
    """Redact credentials/secrets/hostnames before sending to LLM."""
    if not isinstance(text, str):
        return text
    
    # Redact database URLs
    text = re.sub(r'([A-Za-z0-9_]+)://([^:]+):([^@]+)@', 
                  r'\1://***:***@', text)
    
    # Redact common secrets (api_key, secret, token, password)
    text = re.sub(
        r'(api[_-]?key|secret|token|password)[\s:=]+[\'"]?([^\'"\s]+)[\'"]?',
        r'\1=***',
        text,
        flags=re.IGNORECASE
    )
    
    return text
```

**When Used:**
1. In `explain_edge()` - before sending evidence snippet to LLM
2. Automatically when edges are passed (metadata only, no source code)

---

#### 4.4 LLM Response Parity & Caching

**Response Format Enforcement:**
- All LLM endpoints expect strict JSON output
- Response mime type: `"application/json"`
- Responses are parsed with `json.loads()` for type safety

**Caching:**
```python
from functools import lru_cache

@lru_cache(maxsize=128)
def explain_edge(source, target, edge_type, evidence_redacted):
    # Cached by all 4 arguments
    ...

@lru_cache(maxsize=32)
def generate_architect_summary(graph_metrics_json):
    # Cached by metrics (max 32 unique metric sets in memory)
    ...
```

---

### 5. **Risk Calculation Engine**

**File:** `backend/classifier/risk_engine.py`

#### 5.1 Risk Metrics Calculation

```python
def calculate_risk(edges):
    fan_out = defaultdict(int)  # Outgoing connections per system
    fan_in = defaultdict(int)   # Incoming connections per system
    sync_graph = defaultdict(list)  # Synchronous dependency graph
    systems = set()
    
    # Build metrics
    for edge in edges:
        source = edge.get("source")
        target = edge.get("target")
        edge_type = edge.get("type")
        
        systems.add(source)
        systems.add(target)
        
        fan_out[source] += 1
        fan_in[target] += 1
        
        if edge_type == "SYNC_API":
            sync_graph[source].append(target)  # For depth calculation
    
    # Calculate sync chain depth via BFS
    def get_sync_depth(start):
        visited = set()
        queue = deque([(start, 0)])
        max_depth = 0
        
        while queue:
            node, depth = queue.popleft()
            max_depth = max(max_depth, depth)
            
            for neighbor in sync_graph[node]:
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append((neighbor, depth + 1))
        
        return max_depth
    
    # Calculate risk for each system
    results = []
    for system in systems:
        fan_out_deg = fan_out[system]
        fan_in_deg = fan_in[system]
        sync_depth = get_sync_depth(system)
        centrality = fan_out_deg + fan_in_deg
        
        # Weighted risk scoring
        risk_score = (fan_out_deg * 15) + (fan_in_deg * 10) + (sync_depth * 20)
        
        # Risk classification
        if risk_score >= 100:
            risk_level = "CRITICAL"
        elif risk_score >= 60:
            risk_level = "HIGH"
        elif risk_score >= 30:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"
        
        results.append({
            "system": system,
            "fanOut": fan_out_deg,
            "fanIn": fan_in_deg,
            "centrality": centrality,
            "syncDepth": sync_depth,
            "riskScore": risk_score,
            "riskLevel": risk_level
        })
    
    # Sort by risk descending
    results.sort(key=lambda x: x["riskScore"], reverse=True)
    return results
```

#### 5.2 Risk Scoring Weights

| Metric | Weight | Interpretation |
|--------|--------|-----------------|
| fan_out × 15 | High | Each outgoing connection = potential failure propagation |
| fan_in × 10 | Medium | Each incoming connection = dependency risk |
| sync_depth × 20 | Highest | Synchronous call chain creates cascading latency/failure |

**Example Risk Calculation:**
```
System: "Flask App"
- fan_out = 4 (calls 4 downstream systems)
- fan_in = 2 (called by 2 upstream systems)
- sync_depth = 3 (max chain: Flask → Service1 → Service2 → ExternalAPI)

Risk Score = (4 × 15) + (2 × 10) + (3 × 20)
           = 60 + 20 + 60
           = 140

Risk Level: CRITICAL (>= 100)
```

#### 5.3 Risk Level Thresholds

```
Risk Score >= 100  → CRITICAL
Risk Score >= 60   → HIGH
Risk Score >= 30   → MEDIUM
Risk Score < 30    → LOW
```

---

### 6. **Data Persistence & Flow**

#### 6.1 edges.json Structure

**Location:** `backend/data/edges.json`

**Format:**
```json
[
  {
    "source": "External Client",
    "target": "Flask App",
    "type": "SYNC_API",
    "file": "backend/app/main.py",
    "line": 42,
    "confidence": "100% (AST Route Match)"
  },
  {
    "source": "Flask App",
    "target": "DB",
    "type": "DB",
    "file": "backend/app/models.py",
    "line": 15,
    "confidence": "85% (Pattern Match)"
  },
  ...
]
```

#### 6.2 Data Flow Across Features

```
┌─────────────────┐
│  Scan Trigger   │
│  (User UI)      │
└────────┬────────┘
         │
         ▼
    ┌─────────────────────────────────┐
    │ Scanner Modules                 │
    │ (AST + Regex Pattern Matching)   │
    │ • flask_parser.py               │
    │ • db_parser.py                  │
    │ • file_parser.py                │
    │ • outbound_http.py              │
    └────────┬────────────────────────┘
             │
             ▼ (generates edges with confidence scores)
    ┌──────────────────────┐
    │ Deduplicate Edges    │
    │ (keep highest conf)  │
    └────────┬─────────────┘
             │
             ▼
    ┌──────────────────────┐
    │  edges.json          │
    │  (persist to disk)   │
    └────────┬─────────────┘
             │
    ┌────────┴──────────────────────────────────┐
    │                                            │
    ▼                                            ▼
┌──────────────────────┐        ┌──────────────────────┐
│ Risk Analysis        │        │ LLM Endpoints        │
│ (Backend)            │        │                      │
│ • calculate_risk()   │        │ • architect_summary  │
│ • returns HIGH/MED   │        │ • recommendations    │
│ • metrics            │        │ • insights           │
└────────┬─────────────┘        └──────────┬───────────┘
         │                                  │
         ├──────────────┬───────────────────┤
         │              │                   │
         ▼              ▼                   ▼
    ┌──────────────────────────────────────────┐
    │ API Response Aggregation                  │
    │ (/api/insights, /api/architect-summary)   │
    └────────┬──────────────────────────────────┘
             │
             ▼
    ┌──────────────────────┐
    │ Frontend Components  │
    │ • Render Metrics     │
    │ • Display LLM Text   │
    │ • Type: JSON         │
    └──────────────────────┘
```

#### 6.3 Backend Environment Configuration

**File:** `backend/.env`

```
GEMINI_API_KEY=your_api_key_here
```

**Loading:**
```python
from dotenv import load_dotenv
load_dotenv(os.path.join(base_dir, ".env"))
api_key = os.environ.get("GEMINI_API_KEY")
```

---

## API Endpoint Reference

| Endpoint | Method | Purpose | LLM Used | Response Type |
|----------|--------|---------|----------|---------------|
| `/api/scan` | POST | Trigger repo scan & generate edges | ❌ No | JSON status |
| `/api/edges` | GET | Fetch all edges | ❌ No | JSON array |
| `/api/recommendations` | GET | Modernization recommendations | ✅ Yes (fallback to heuristic) | JSON array |
| `/api/architect-summary` | GET | Architecture narrative + metrics | ✅ Yes (LLM-only) | JSON object |
| `/api/insights` | GET | Risk + metrics + patterns + LLM | ✅ Yes (partial) | JSON object |
| `/api/risk-analysis` | GET | Risk scores (heuristic only) | ❌ No | JSON array |
| `/api/export/mermaid` | GET | Mermaid diagram | ❌ No | Text (Mermaid syntax) |
| `/api/llm/explain` | POST | Explain specific edge | ✅ Yes | JSON object |

---

## Key Algorithms & Heuristics

### 6.1 Confidence Score Hierarchy

```
Direct AST Match (e.g., @app.route)        → 100%
Literal String/Pattern (import statement)  → 85-90%
Dynamic Call (Variable reference)          → 60-80%
Indirect Reference (f-string/concat)       → 55-70%
Environment Variable                       → 70%
```

### 6.2 Deduplication Strategy

When multiple detections find the same edge:
```
Key = (source, target, type, file, line)
If Key exists:
    Keep edge with HIGHEST numeric confidence value
```

### 6.3 Average Confidence Computation

```
avg = (sum of all numeric confidence values) / (count of edges)
Rounded to nearest integer
Used for: matchingConfidence, architecture score adjustments
```

---

## LLM Prompt Engineering Summary

| Feature | Prompt Focus | Response Format |
|---------|--------------|-----------------|
| Architect Summary | Complexity, patterns, risk assessment | JSON: `{"summary": "..."}` |
| Recommendations | Modernization opportunities, severity | JSON: `[{system, title, severity, why, recommendation, steps}]` |
| Edge Explanation | Purpose, architectural risks | Plain text (2-3 sentences) |

**Common Prompt Rules:**
- No markdown formatting in responses
- No recommendations in architect summary
- Strict JSON for structured outputs
- Ignore system metrics that aren't provided

---

## Error Handling & Fallbacks

| Feature | Primary | Fallback |
|---------|---------|----------|
| Recommendations | LLM | Heuristic rules (high fan-out, sync depth, direct DB) |
| Architect Summary | LLM | Error message (no fallback) |
| Insights | LLM + Heuristic | Heuristic risk engine only |
| Explanation | LLM | Placeholder message |

**LLM Fallback Models:**
```
1. gemini-3.1-flash-lite-preview
2. gemini-3.1-pro
3. gemini-3-flash-preview
4. gemini-2.5-flash
5. gemini-2.0-flash
(Retry with "models/" prefix if all fail)
```

---

## Security & Privacy Considerations

1. **No Source Code Sent to LLM:** Only metadata (system name, edge type, confidence) is sent.
2. **Secret Redaction:** Database URLs, API keys, tokens are redacted before any LLM call.
3. **API Key Storage:** Stored in `backend/.env` (NEVER in frontend build).
4. **Frontend:** Removed process.env.GEMINI_API_KEY exposure from vite.config.ts.
5. **Logging:** LLM prompts/responses should be logged for audit but secrets must be redacted.

---

## Performance Considerations

1. **LLM Caching:** `@lru_cache` decorators cache LLM responses by input (max 128 for edge explanations, 32 for architect summary).
2. **Deduplication:** Reduces edges.json size before LLM processing.
3. **Batch Processing:** LLM recommendations processes entire edge list in single call (not per-edge).
4. **Fallback Strategy:** Heuristic rules execute instantly; LLM adds ~2-5sec latency per endpoint.

---

## Future Enhancement Opportunities

1. **Confidence Score Augmentation via LLM:** Batch score all edges, blend with heuristics.
2. **Async Scoring:** Background worker queue (Celery/RQ) for LLM processing.
3. **Caching Layer:** Redis cache for LLM outputs keyed by {edges_hash, model_id}.
4. **Fine-Tuning:** Collect user feedback labels to calibrate LLM scoring against ground truth.
5. **Custom Thresholds:** UI sliders to adjust min confidence and risk tiers per organization.
6. **Explainability Dashboard:** Per-edge scoring breakdown (heuristic value, LLM value, reasoning).

---

## Testing & Validation

### Unit Tests

**Location:** `backend/tests/test_gemini_client.py`

Validates:
- LLM client initialization
- Secret redaction patterns
- JSON response parsing
- Fallback model behavior
- Caching mechanism

### Integration Tests

- Scan → edges.json → API response chain
- Mock LLM responses to validate downstream logic
- Risk calculation correctness

---

## Summary Table

| Component | Technology | Location | Purpose |
|-----------|-----------|----------|---------|
| Frontend | React + Vite | `frontend/src/` | User interface |
| Backend | Flask | `backend/app/api.py` | API endpoints |
| Scanners | AST + Regex | `backend/app/scanner/` | Pattern detection |
| Classifiers | Heuristics | `backend/classifier/` | Risk & recommendations |
| LLM Client | google-generativeai | `backend/llm/gemini_client.py` | Gemini API wrapper |
| Persistence | JSON | `backend/data/edges.json` | Edge storage |
| Configuration | .env | `backend/.env` | API keys |

---

**End of Document**
