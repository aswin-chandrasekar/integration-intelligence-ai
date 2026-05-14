import { useEffect, useState } from "react";

interface Recommendation {
  system: string;
  title: string;
  severity: string;
  why: string;
  recommendation: string;
  steps: string[];
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "HIGH":
    case "CRITICAL":
      return "#ef4444";
    case "MEDIUM":
      return "#f59e0b";
    default:
      return "#22c55e";
  }
};

const RecommendationsPanel = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/recommendations")
      .then((res) => res.json())
      .then((data) => {
        setRecommendations(data);
      })
      .catch((err) => {
        console.error("Recommendations fetch failed:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="bg-app-surface border border-app-border rounded-xl p-6 transition-colors">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-app-text">
          Modernization Recommendations
        </h2>
        <p className="text-app-text-muted text-sm mt-1">
          Modernization opportunities and risk reduction strategies.
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <p className="text-app-text-muted">
          Loading recommendations...
        </p>
      )}

      {/* Empty */}
      {!loading && recommendations.length === 0 && (
        <p className="text-app-text-muted">
          No recommendations available.
        </p>
      )}

      {/* Cards */}
      <div className="space-y-5">
        {recommendations.map((rec, idx) => (
          <div
            key={idx}
            className="bg-app-bg border border-app-border rounded-xl p-5 transition-colors"
          >
            {/* Top */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-app-text font-bold text-lg">
                  {rec.title}
                </h3>
                <p className="text-sm text-app-text-muted mt-1">
                  System: {rec.system}
                </p>
              </div>

              <div
                style={{
                  background: getSeverityColor(rec.severity),
                  color: "white",
                  padding: "4px 10px",
                  borderRadius: "999px",
                  fontSize: "11px",
                  fontWeight: "bold"
                }}
              >
                {rec.severity}
              </div>
            </div>

            {/* WHY */}
            <div className="mt-5">
              <p className="text-xs uppercase tracking-widest text-app-text-muted font-black mb-2">
                Why This Matters
              </p>
              <p className="text-sm text-app-text leading-relaxed opacity-90">
                {rec.why}
              </p>
            </div>

            {/* Recommendation */}
            <div className="mt-5">
              <p className="text-xs uppercase tracking-widest text-app-text-muted font-black mb-2">
                Recommendation
              </p>
              <p className="text-sm text-app-text leading-relaxed font-medium">
                {rec.recommendation}
              </p>
            </div>

            {/* Steps */}
            <div className="mt-5">
              <p className="text-xs uppercase tracking-widest text-app-text-muted font-black mb-3">
                Suggested Steps
              </p>

              <div className="space-y-2">
                {rec.steps?.map((step, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 text-sm text-app-text transition-all opacity-90"
                  >
                    <div className="min-w-[22px] h-[22px] rounded-full flex items-center justify-center text-xs font-bold bg-app-brand text-white shadow-sm transition-colors">
                      {i + 1}
                    </div>
                    <p className="pt-0.5">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendationsPanel;