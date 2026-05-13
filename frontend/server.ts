import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  let scanStatus = "Idle";

  // API Routes
  app.post("/api/scan", (req, res) => {
    const { repoPath } = req.body;
    if (!repoPath) {
      return res.status(400).json({ error: "Repository path is required" });
    }
    
    scanStatus = "Scanning";
    res.json({ status: "Scanning", message: "Scan initiated successfully" });

    // Forward request to actual Flask backend in the background
    // We map camelCase 'repoPath' to snake_case 'repo_path' which Flask expects
    fetch("http://127.0.0.1:5000/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repo_path: repoPath })
    }).then(async (response) => {
      if (response.ok) {
        scanStatus = "Completed";
      } else {
        scanStatus = "Error";
        console.error("Backend scan failed with status:", response.status);
      }
    }).catch((err) => {
      scanStatus = "Error";
      console.error("Failed to connect to backend:", err);
    });
  });

  app.get("/api/status", (req, res) => {
    res.json({ status: scanStatus });
  });

  app.get("/api/edges", async (req, res) => {
    try {
      const response = await fetch("http://127.0.0.1:5000/api/edges");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (e) {
      console.error("Error fetching edges from backend:", e);
      res.status(500).json({ error: "Could not fetch edges from backend" });
    }
  });

  app.get("/api/export/mermaid", async (req, res) => {
    try {
      const query = new URLSearchParams(req.query as Record<string, string>).toString();
      const url = `http://127.0.0.1:5000/api/export/mermaid${query ? `?${query}` : ""}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (e) {
      console.error("Error fetching Mermaid export from backend:", e);
      res.status(500).json({ error: "Could not export Mermaid diagram" });
    }
  });

  app.get("/api/impact", async (req, res) => {
    try {
      const node = req.query.node;
      const depth = req.query.depth || 1;
      const direction = req.query.direction || "both";
      const response = await fetch(`http://127.0.0.1:5000/api/impact?node=${node}&depth=${depth}&direction=${direction}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      res.json(await response.json());
    } catch (e) {
      console.error("Error fetching impact from backend:", e);
      res.status(500).json({ error: "Could not fetch impact from backend" });
    }
  });

  app.get("/api/impact/:system_name", async (req, res) => {
    try {
      const depth = req.query.depth || 1;
      const direction = req.query.direction || "both";
      const response = await fetch(`http://127.0.0.1:5000/api/impact/${req.params.system_name}?depth=${depth}&direction=${direction}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      res.json(await response.json());
    } catch (e) {
      console.error("Error fetching system impact from backend:", e);
      res.status(500).json({ error: "Could not fetch system impact from backend" });
    }
  });

  app.get("/api/insights", async (req, res) => {
    try {
      const response = await fetch("http://127.0.0.1:5000/api/insights");
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      res.json(await response.json());
    } catch (e) {
      console.error("Error fetching insights from backend:", e);
      res.status(500).json({ error: "Could not fetch insights from backend" });
    }
  });

  app.get("/api/recommendations", async (req, res) => {
    try {
      const response = await fetch("http://127.0.0.1:5000/api/recommendations");
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      res.json(await response.json());
    } catch (e) {
      console.error("Error fetching recommendations from backend:", e);
      res.status(500).json({ error: "Could not fetch recommendations from backend" });
    }
  });

  app.get("/api/risk-analysis", async (req, res) => {
    try {
      const response = await fetch("http://127.0.0.1:5000/api/risk-analysis");
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      res.json(await response.json());
    } catch (e) {
      console.error("Error fetching risk analysis from backend:", e);
      res.status(500).json({ error: "Could not fetch risk analysis from backend" });
    }
  });

  app.get("/api/architect-summary", async (req, res) => {
    try {
      const response = await fetch("http://127.0.0.1:5000/api/architect-summary");
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      res.json(await response.json());
    } catch (e) {
      console.error("Error fetching architect summary from backend:", e);
      res.status(500).json({ error: "Could not fetch architect summary from backend" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serving static files from dist in production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
