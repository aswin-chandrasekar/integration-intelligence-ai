import { useEffect, useState } from "react";

interface SummaryData {
  summary: string;
  systems: number;
  integrations: number;
  syncIntegrations: number;
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
      <div className="bg-[#1c1917] border border-stone-800 rounded-xl p-6 text-stone-500">
        Loading architecture summary...
      </div>
    );
  }

  return (
    <div className="bg-[#1c1917] border border-stone-800 rounded-xl p-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-5 mb-6">

        <div>
          <h2 className="text-xl font-bold text-white">
            Architect Summary
          </h2>

          <p className="text-stone-500 text-sm mt-1">
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">

        <div className="bg-[#0c0a09] border border-stone-800 rounded-xl p-4">
          <p className="text-stone-500 text-xs uppercase">
            Systems
          </p>

          <p className="text-white text-2xl font-bold mt-2">
            {data.systems}
          </p>
        </div>

        <div className="bg-[#0c0a09] border border-stone-800 rounded-xl p-4">
          <p className="text-stone-500 text-xs uppercase">
            Integrations
          </p>

          <p className="text-white text-2xl font-bold mt-2">
            {data.integrations}
          </p>
        </div>

        <div className="bg-[#0c0a09] border border-stone-800 rounded-xl p-4">
          <p className="text-stone-500 text-xs uppercase">
            Sync APIs
          </p>

          <p className="text-white text-2xl font-bold mt-2">
            {data.syncIntegrations}
          </p>
        </div>

        <div className="bg-[#0c0a09] border border-stone-800 rounded-xl p-4">
          <p className="text-stone-500 text-xs uppercase">
            DB Calls
          </p>

          <p className="text-white text-2xl font-bold mt-2">
            {data.dbIntegrations}
          </p>
        </div>

        <div className="bg-[#0c0a09] border border-stone-800 rounded-xl p-4">
          <p className="text-stone-500 text-xs uppercase">
            File Ops
          </p>

          <p className="text-white text-2xl font-bold mt-2">
            {data.fileIntegrations}
          </p>
        </div>

      </div>

      {/* Summary */}
      <div className="bg-[#0c0a09] border border-stone-800 rounded-xl p-5">

        <p className="text-sm text-stone-300 leading-7 whitespace-pre-line">
          {data.summary}
        </p>

      </div>

      {/* Coupled System */}
      <div className="mt-6 bg-[#0c0a09] border border-red-900 rounded-xl p-5">

        <p className="text-xs uppercase tracking-widest text-red-400 mb-2">
          Most Coupled System
        </p>

        <p className="text-white text-lg font-bold">
          {data.mostCoupledSystem}
        </p>

      </div>

    </div>
  );
};

export default ArchitectSummaryPanel;