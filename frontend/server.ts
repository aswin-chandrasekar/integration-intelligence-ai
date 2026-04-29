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

  // Mock database for demo purposes
  let scanStatus = "Idle";
  const mockIntegrations = [
    {
      id: "1",
      source: "Stripe API",
      target: "Checkout Service",
      type: "REST",
      evidence: "src/services/pay.js:42",
      confidence: "98% Match",
      note: "High match",
      color: "blue"
    },
    {
      id: "2",
      source: "PostgreSQL",
      target: "User DB Cluster",
      type: "SQL",
      evidence: "lib/db/client.ts:112",
      confidence: "Internal",
      note: "Internal Connection",
      color: "purple"
    },
    {
      id: "3",
      source: "Kafka",
      target: "Audit-Logging",
      type: "Pub/Sub",
      evidence: "handlers/events.go:88",
      confidence: "Detected",
      note: "Producer detected",
      color: "orange"
    },
    {
      id: "4",
      source: "Twilio SDK",
      target: "SMS Gateway",
      type: "SDK",
      evidence: "utils/notify.py:15",
      confidence: "82%",
      note: "Medium confidence",
      color: "cyan"
    }
  ];

  // API Routes
  app.post("/api/scan", (req, res) => {
    const { repoPath } = req.body;
    if (!repoPath) {
      return res.status(400).json({ error: "Repository path is required" });
    }
    
    scanStatus = "Scanning";
    
    // Simulate a scan process
    setTimeout(() => {
      scanStatus = "Completed";
    }, 5000);

    res.json({ status: "Scanning", message: "Scan initiated successfully" });
  });

  app.get("/api/status", (req, res) => {
    res.json({ status: scanStatus });
  });

  app.get("/api/edges", (req, res) => {
    // Return mock data
    res.json(mockIntegrations);
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
