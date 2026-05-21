import { useEffect, useState } from "react";

interface SummaryData {
  summary: string;
  systems: number;
  integrations: number;
  syncIntegrations: number;
  pubsubIntegrations: number;
  dbIntegrations: number;
  fileIntegrations: number;
  mostCoupledSystem: string;
  overallRisk: string;
}

const getRiskColor = (risk: string) => {
  switch (risk) {
    case "HIGH":
      return "#ef4444";
    case "MEDIUM":
      return "#f59e0b";
    default:
      return "#22c55e";
  }
};

const ArchitectSummaryPanel = () => {
  const [data, setData] = useState<SummaryData | null>(null);

  useEffect(() => {
    fetch("/api/architect-summary")
      .then((res) => res.json())
      .then((result) => {
        setData(result);
      })
      .catch((err) => {
        console.error("Architect summary fetch failed:", err);
      });
  }, []);

  if (!data) {
    return (
      <div className="bg-app-surface border border-app-border rounded-xl p-6 text-app-text-muted transition-colors">
        Loading architecture summary...
      </div>
    );
  }

  return (
    <div className="bg-app-surface border border-app-border rounded-xl p-6 transition-colors">

      {/* Header */}
      <div className="flex items-start justify-between gap-5 mb-6">
        <div>
          <h2 className="text-xl font-bold text-app-text">
            Architect Summary
          </h2>
          <p className="text-app-text-muted text-sm mt-1">
            Architecture analysis and modernization overview.
          </p>
        </div>

        <div
          style={{
            background: getRiskColor(data.overallRisk),
            color: "white",
            padding: "6px 12px",
            borderRadius: "999px",
            fontSize: "12px",
            fontWeight: "bold"
          }}
        >
          {data.overallRisk} RISK
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
        <div className="bg-app-bg border border-app-border rounded-xl p-4 transition-colors">
          <p className="text-app-text-muted text-xs uppercase font-black tracking-wider">
            Systems
          </p>
          <p className="text-app-text text-2xl font-extrabold mt-2">
            {data.systems}
          </p>
        </div>

        <div className="bg-app-bg border border-app-border rounded-xl p-4 transition-colors">
          <p className="text-app-text-muted text-xs uppercase font-black tracking-wider">
            Integrations
          </p>
          <p className="text-app-text text-2xl font-extrabold mt-2">
            {data.integrations}
          </p>
        </div>

        <div className="bg-app-bg border border-app-border rounded-xl p-4 transition-colors">
          <p className="text-app-text-muted text-xs uppercase font-black tracking-wider">
            Sync APIs
          </p>
          <p className="text-app-text text-2xl font-extrabold mt-2">
            {data.syncIntegrations}
          </p>
        </div>

        <div className="bg-app-bg border border-app-border rounded-xl p-4 transition-colors">
          <p className="text-app-text-muted text-xs uppercase font-black tracking-wider">
            Pub/Sub
          </p>
          <p className="text-app-text text-2xl font-extrabold mt-2">
            {data.pubsubIntegrations}
          </p>
        </div>

        <div className="bg-app-bg border border-app-border rounded-xl p-4 transition-colors">
          <p className="text-app-text-muted text-xs uppercase font-black tracking-wider">
            DB Calls
          </p>
          <p className="text-app-text text-2xl font-extrabold mt-2">
            {data.dbIntegrations}
          </p>
        </div>

        <div className="bg-app-bg border border-app-border rounded-xl p-4 transition-colors">
          <p className="text-app-text-muted text-xs uppercase font-black tracking-wider">
            File Ops
          </p>
          <p className="text-app-text text-2xl font-extrabold mt-2">
            {data.fileIntegrations}
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-app-bg border border-app-border rounded-xl p-5 transition-colors">
        <p className="text-sm text-app-text leading-7 whitespace-pre-line">
          {data.summary}
        </p>
      </div>

      {/* Coupled System */}
      <div className="mt-6 bg-app-bg border border-rose-500/30 rounded-xl p-5 transition-colors">
        <p className="text-xs uppercase tracking-widest text-rose-500 font-black mb-2">
          Most Coupled System
        </p>
        <p className="text-app-text text-lg font-bold">
          {data.mostCoupledSystem}
        </p>
      </div>

    </div>
  );
};

export default ArchitectSummaryPanel;
