import React, { useState, useEffect } from 'react';
import {
  Network,
  ShieldAlert,
  Component,
  CheckCircle2,
  RefreshCw,
  Database,
  Cloud,
  Link,
  Lightbulb,
  Zap,
  AlertCircle,
  ArrowLeft,
  LayoutDashboard,
  Activity,
  Database as DatabaseIcon
} from 'lucide-react';
import { motion } from 'motion/react';
import RecommendationsPanel from './RecommendationsPanel';
import ArchitectSummaryPanel from './ArchitectSummaryPanel';
import { queryArchitecture } from '../services/api';

interface AIInsightsProps {
  onNavigateToDashboard?: () => void;
  onNavigateToSection?: (sectionId: string) => void;
  integrations?: any[];
}

interface InsightsData {
  metrics: {
    totalIntegrations: { value: number; change: string; trend: string };
    activeSecurityRisks: { value: number; change: string; trend: string; badge: string };
    architectureScore: { value: number; progress: number; suffix: string };
    matchingConfidence: { value: number; detail: string; suffix: string };
  };
  patterns: {
    title: string;
    desc: string;
    locations?: string;
    status?: string;
    isRisk?: boolean;
    fullWidth?: boolean;
    tags?: string[];
    icon: string;
  }[];
  confidenceIndex: {
    globalPrecision: number;
    dataMapping: number;
    securityLogic: number;
    latencyPrediction: number;
  };
  risks: {
    type: string;
    detail: string;
    impact: string;
    evidence: string;
    action?: string;
  }[];
  recommendations: {
    icon: string;
    title: string;
    desc: string;
  }[];
}

const getIcon = (name: string) => {
  switch (name) {
    case 'RefreshCw': return <RefreshCw />;
    case 'Database': return <Database />;
    case 'Cloud': return <Cloud />;
    case 'Zap': return <Zap />;
    case 'AlertCircle': return <AlertCircle />;
    default: return <Component />;
  }
};

const defaultData: InsightsData = {
  metrics: {
    totalIntegrations: { value: 142, change: "+12%", trend: "up" },
    activeSecurityRisks: { value: 18, change: "+4", trend: "up", badge: "High" },
    architectureScore: { value: 72, progress: 72, suffix: "/100" },
    matchingConfidence: { value: 94, detail: "Neural precision: high", suffix: "%" }
  },
  patterns: [
    {
      title: "Event-Driven Synchronization",
      desc: "Primary flow for high-scale messaging systems.",
      locations: "12 Locations Found",
      status: "STABLE",
      icon: "RefreshCw"
    },
    {
      title: "Direct SQL Access",
      desc: "Found in legacy modules, bypasses API layers.",
      locations: "Technical Debt Flagged",
      status: "RISK",
      isRisk: true,
      icon: "Database"
    },
    {
      title: "Third-Party API Dependency",
      desc: "High reliance on Stripe and Twilio found across 8 core modules.",
      fullWidth: true,
      tags: ["Stripe", "Twilio"],
      icon: "Cloud"
    }
  ],
  confidenceIndex: {
    globalPrecision: 94.2,
    dataMapping: 98,
    securityLogic: 89,
    latencyPrediction: 92
  },
  risks: [
    {
      type: "Hardcoded API Credentials",
      detail: "Possible secrets exposure in code",
      impact: "CRITICAL",
      evidence: "src/auth/gatekeeper.js:142"
    },
    {
      type: "Unencrypted Data Transfer",
      detail: "HTTP detected on internal microservice",
      impact: "HIGH",
      evidence: "config/network.yml:45"
    },
    {
      type: "Stale Webhook Endpoint",
      detail: "No traffic detected in 30 days",
      impact: "LOW",
      evidence: "api/v1/webhooks/legacy",
      action: "Archive"
    }
  ],
  recommendations: [
    {
      icon: "Zap",
      title: "Consolidate redundant Stripe API calls",
      desc: "The 'Checkout' and 'UserAccount' modules call Stripe's metadata endpoint separately. Move to a shared provider to save 200ms latency."
    },
    {
      icon: "AlertCircle",
      title: "Implement circuit breaker for Twilio",
      desc: "Current integration lacks failure isolation. Implement a circuit breaker pattern to prevent cascading failures during Twilio outages."
    }
  ]
};

const AIInsights: React.FC<AIInsightsProps> = ({ onNavigateToDashboard, onNavigateToSection, integrations = [] }) => {
  const [data, setData] = useState<InsightsData>(defaultData);
  const [qaQuestion, setQaQuestion] = useState('');
  const [qaAnswer, setQaAnswer] = useState<string | null>(null);
  const [qaLoading, setQaLoading] = useState(false);
  const [qaError, setQaError] = useState<string | null>(null);

  const askArchitectureQuestion = async () => {
    const trimmed = qaQuestion.trim();
    if (!trimmed) {
      setQaError('Ask a question about architecture first.');
      return;
    }

    setQaError(null);
    setQaLoading(true);
    setQaAnswer(null);

    try {
      const result = await queryArchitecture(trimmed);
      const answerText = typeof result === 'string'
        ? result
        : result?.answer ?? JSON.stringify(result, null, 2);
      setQaAnswer(answerText || 'No answer returned.');
    } catch (error) {
      console.error('Architecture query failed:', error);
      setQaError('Failed to fetch answer. Try again later.');
    } finally {
      setQaLoading(false);
    }
  };

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const response = await fetch('/api/insights');
        const jsonData = await response.json();
        setData(jsonData);
      } catch (error) {
        console.error('Error fetching insights:', error);
      }
    };

    fetchInsights();
  }, [integrations]);

  const handleExportReport = () => {
    const lines: string[] = [];
    const now = new Date();
    lines.push('AI Insights Report');
    lines.push(`Generated: ${now.toLocaleString()}`);
    lines.push('');
    lines.push('--- Metrics ---');
    lines.push(`Total Integrations: ${data.metrics.totalIntegrations.value} (${data.metrics.totalIntegrations.change})`);
    lines.push(`Active Security Risks: ${data.metrics.activeSecurityRisks.value} (${data.metrics.activeSecurityRisks.badge})`);
    lines.push(`Architecture Score: ${data.metrics.architectureScore.value}${data.metrics.architectureScore.suffix}`);
    lines.push(`Matching Confidence: ${data.metrics.matchingConfidence.value}${data.metrics.matchingConfidence.suffix}`);
    lines.push('');
    lines.push('--- Architectural Patterns ---');
    data.patterns.forEach(pattern => {
      lines.push(`- ${pattern.title}`);
      lines.push(`  Description: ${pattern.desc}`);
      if (pattern.locations) lines.push(`  Locations: ${pattern.locations}`);
      if (pattern.status) lines.push(`  Status: ${pattern.status}`);
      if (pattern.tags?.length) lines.push(`  Tags: ${pattern.tags.join(', ')}`);
      lines.push('');
    });
    lines.push('--- Confidence Index ---');
    lines.push(`Global Precision: ${data.confidenceIndex.globalPrecision}%`);
    lines.push(`Data Mapping: ${data.confidenceIndex.dataMapping}%`);
    lines.push(`Security Logic: ${data.confidenceIndex.securityLogic}%`);
    lines.push(`Latency Prediction: ${data.confidenceIndex.latencyPrediction}%`);
    lines.push('');
    lines.push('--- Risks ---');
    data.risks.forEach(risk => {
      lines.push(`- ${risk.type} (${risk.impact})`);
      lines.push(`  Evidence: ${risk.evidence}`);
      lines.push(`  Detail: ${risk.detail}`);
      if (risk.action) lines.push(`  Action: ${risk.action}`);
      lines.push('');
    });
    lines.push('--- Recommendations ---');
    data.recommendations.forEach(rec => {
      lines.push(`- ${rec.title}`);
      lines.push(`  ${rec.desc}`);
      lines.push('');
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-insights-report-${now.toISOString().slice(0,19).replace(/[:T]/g, '-')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-app-text">AI Insights</h1>
            <p className="text-app-text-muted font-medium">Automated analysis of architectural patterns and integration risks.</p>
          </div>
        </div>
      </section>

      {/* Metrics Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Total Integrations" 
          value={data.metrics.totalIntegrations.value.toString()} 
          change={data.metrics.totalIntegrations.change} 
          trend={data.metrics.totalIntegrations.trend} 
          icon={<Network className="text-app-brand" />} 
        />
        <MetricCard 
          title="Active Security Risks" 
          value={data.metrics.activeSecurityRisks.value.toString()} 
          change={data.metrics.activeSecurityRisks.change} 
          trend={data.metrics.activeSecurityRisks.trend} 
          badge={data.metrics.activeSecurityRisks.badge} 
          icon={<ShieldAlert className="text-rose-500" />} 
        />
        <MetricCard 
          title="Architecture Score" 
          value={data.metrics.architectureScore.value.toString()} 
          suffix={data.metrics.architectureScore.suffix} 
          progress={data.metrics.architectureScore.progress} 
          icon={<Component className="text-app-text-muted" />} 
        />
        <MetricCard 
          title="Matching Confidence" 
          value={`${data.metrics.matchingConfidence.value}${data.metrics.matchingConfidence.suffix}`} 
          detail={data.metrics.matchingConfidence.detail} 
          icon={<CheckCircle2 className="text-emerald-500" />} 
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Architectural Patterns */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-app-text">Architectural Patterns</h2>
            </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.patterns.map((pattern, index) => (
              <PatternCard 
                key={index}
                title={pattern.title} 
                desc={pattern.desc}
                locations={pattern.locations}
                status={pattern.status}
                isRisk={pattern.isRisk}
                fullWidth={pattern.fullWidth}
                tags={pattern.tags}
                icon={getIcon(pattern.icon)}
              />
            ))}
          </div>
        </div>

        {/* Confidence Index */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-app-text">Confidence Index</h2>
          <div className="bg-app-surface border border-app-border p-8 rounded-xl space-y-8 transition-colors">
            <div className="flex flex-col items-center justify-center py-6 relative">
              <div className="w-40 h-40 rounded-full border-8 border-app-bg flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full border-8 border-app-brand border-t-transparent border-r-transparent transform -rotate-12"></div>
                <div className="text-center">
                  <span className="text-4xl font-black text-app-text block">{data.confidenceIndex.globalPrecision}</span>
                  <span className="text-[10px] text-app-text-muted font-bold uppercase tracking-widest">Global Precision</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <ConfidenceBar label="Data Mapping" value={data.confidenceIndex.dataMapping} />
              <ConfidenceBar label="Security Logic" value={data.confidenceIndex.securityLogic} />
              <ConfidenceBar label="Latency Prediction" value={data.confidenceIndex.latencyPrediction} />
            </div>
          </div>
        </div>
      </div>

      {/* Security & Risk Audit */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-app-text">Security & Risk Audit</h2>
          <div className="flex gap-2">
            <button onClick={handleExportReport} className="px-4 py-2 border border-app-border rounded-lg text-sm font-bold text-app-text hover:bg-app-surface-hover transition-colors cursor-pointer">Export Report</button>
          </div>
        </div>

        <div className="bg-app-surface border border-app-border rounded-xl overflow-hidden shadow-sm transition-colors">
          <table className="w-full text-left border-collapse">
            <thead className="bg-app-bg border-b border-app-border">
              <tr>
                <th className="px-8 py-4 text-[10px] font-black text-app-text-muted uppercase tracking-widest">Risk Type</th>
                <th className="px-8 py-4 text-[10px] font-black text-app-text-muted uppercase tracking-widest">Impact</th>
                <th className="px-8 py-4 text-[10px] font-black text-app-text-muted uppercase tracking-widest">Evidence</th>
                <th className="px-8 py-4 text-[10px] font-black text-app-text-muted uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-app-border">
              {data.risks.map((risk, index) => (
                <RiskRow 
                  key={index}
                  type={risk.type} 
                  detail={risk.detail} 
                  impact={risk.impact} 
                  evidence={risk.evidence}
                  action={risk.action}
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>


      {/* Modernization Recommendations */}
      <section className="space-y-6">
        <RecommendationsPanel />
      </section>

      {/* Architecture Summary */}
      <section className="space-y-6">
        <ArchitectSummaryPanel />
      </section>

      {/* Architecture Q&A */}
      <section className="space-y-6">
        <div className="bg-app-surface border border-app-border rounded-xl p-8 shadow-sm transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-app-text">Architecture Q&A</h2>
              <p className="text-app-text-muted text-sm mt-1">Ask a question about the current architecture.</p>
            </div>
          </div>

          <textarea
            className="w-full min-h-[140px] mt-6 p-4 border border-app-border rounded-xl bg-app-bg text-app-text focus:outline-none focus:ring-2 focus:ring-app-brand"
            value={qaQuestion}
            onChange={(e) => setQaQuestion(e.target.value)}
          />
          {qaError && <p className="text-rose-500 text-sm mt-2">{qaError}</p>}

          <button
            onClick={askArchitectureQuestion}
            disabled={qaLoading}
            className="mt-4 px-5 py-3 rounded-xl bg-app-brand text-white font-bold text-sm hover:bg-app-brand-hover transition-all disabled:opacity-50"
          >
            {qaLoading ? 'Asking…' : 'Ask Architecture Q&A'}
          </button>

          {qaAnswer !== null && (
            <div className="mt-6 bg-app-bg border border-app-border rounded-xl p-4 text-sm text-app-text leading-relaxed whitespace-pre-line">
              {qaAnswer}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

const MetricCard: React.FC<{ title: string; value: string; suffix?: string; change?: string; trend?: string; progress?: number; detail?: string; badge?: string; icon: React.ReactNode }> = ({ title, value, suffix, change, trend, progress, detail, badge, icon }) => (
  <div className="bg-app-surface border border-app-border p-6 rounded-xl flex flex-col justify-between h-40 transition-colors">
    <div className="flex justify-between items-start">
      <span className="text-app-text-muted font-bold text-xs uppercase tracking-wider">{title}</span>
      {badge ? (
        <span className="bg-rose-500/10 text-rose-600 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-500/20">{badge}</span>
      ) : icon}
    </div>
    <div className="mt-4">
      <div className="text-3xl font-black text-app-text">
        {value}{suffix && <span className="text-xl text-app-text-muted ml-1">{suffix}</span>}
      </div>
      {change && (
        <div className={`text-xs font-bold mt-1 ${trend === 'up' ? 'text-emerald-500' : 'text-app-text-muted'}`}>
          {change} <span className="text-app-text-muted font-medium ml-1">from last scan</span>
        </div>
      )}
      {progress !== undefined && (
        <div className="w-full bg-app-bg h-1.5 rounded-full mt-3 overflow-hidden border border-app-border">
          <div className="bg-app-brand h-full rounded-full" style={{ width: `${progress}%` }}></div>
        </div>
      )}
      {detail && <div className="text-xs text-app-text-muted font-medium mt-1">{detail}</div>}
    </div>
  </div>
);

const PatternCard: React.FC<{ title: string; desc: string; locations?: string; status?: string; isRisk?: boolean; fullWidth?: boolean; tags?: string[]; icon: React.ReactNode }> = ({ title, desc, locations, status, isRisk, fullWidth, tags, icon }) => (
  <div className={`bg-app-surface border border-app-border p-6 rounded-xl space-y-4 transition-colors ${fullWidth ? 'md:col-span-2' : ''}`}>
    <div className="flex items-start gap-4">
      <div className={`p-3 rounded-xl transition-colors ${isRisk ? 'bg-rose-500/10 text-rose-600' : 'bg-app-bg text-app-brand'}`}>
        {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-6 h-6' })}
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-bold text-app-text">{title}</h4>
        <p className="text-xs text-app-text-muted font-medium leading-relaxed">{desc}</p>
        {tags && (
          <div className="flex gap-2 mt-4">
            {tags.map(tag => (
              <div key={tag} className="flex items-center gap-1.5 bg-app-bg border border-app-border px-3 py-1 rounded-full text-[10px] font-bold text-app-text-muted transition-colors">
                <span className={`w-1.5 h-1.5 rounded-full ${tag === 'Stripe' ? 'bg-app-brand' : 'bg-emerald-500'}`}></span>
                {tag}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    {(locations || status) && (
      <div className="flex justify-between items-center pt-4 border-t border-app-border transition-colors">
        <span className={`text-[10px] font-black uppercase tracking-widest ${isRisk ? 'text-rose-600' : 'text-app-text-muted'}`}>{locations}</span>
        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${isRisk ? 'bg-rose-600 text-white shadow-sm' : 'bg-app-bg text-app-text-muted border border-app-border'}`}>{status}</span>
      </div>
    )}
  </div>
);

const ConfidenceBar: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest">
      <span className="text-app-text-muted">{label}</span>
      <span className="text-app-text">{value}%</span>
    </div>
    <div className="h-1 bg-app-bg border border-app-border rounded-full overflow-hidden transition-colors">
      <div className="bg-app-brand h-full rounded-full" style={{ width: `${value}%` }}></div>
    </div>
  </div>
);

const RiskRow: React.FC<{ type: string; detail: string; impact: string; evidence: string; action?: string }> = ({ type, detail, impact, evidence, action = 'Dismiss' }) => (
  <tr className="hover:bg-app-surface-hover/50 transition-colors group">
    <td className="px-8 py-4">
      <div className="flex flex-col">
        <span className="text-sm font-bold text-app-text">{type}</span>
        <span className="text-xs text-app-text-muted font-medium">{detail}</span>
      </div>
    </td>
    <td className="px-8 py-4">
      <span className={`px-2 py-0.5 text-[10px] font-black rounded transition-colors ${
        impact === 'CRITICAL' ? 'bg-rose-500/20 text-rose-600 border border-rose-500/30' : 
        impact === 'HIGH' ? 'bg-amber-500/20 text-amber-600 border border-amber-500/30' : 'bg-app-bg text-app-text-muted border border-app-border'
      }`}>{impact}</span>
    </td>
    <td className="px-8 py-4">
      <div className="text-app-text text-xs font-bold flex items-center gap-1.5">
        <Link className="w-3.5 h-3.5" />
        {evidence}
      </div>
    </td>
    <td className="px-8 py-4 text-right">
      <span className="text-app-text font-black text-[10px] uppercase tracking-widest">{action}</span>
    </td>
  </tr>
);

const RecommendationItem: React.FC<{ icon: React.ReactNode; title: string; desc: string }> = ({ icon, title, desc }) => (
  <li className="flex gap-4 p-5 bg-stone-950/40 rounded-xl backdrop-blur-md border border-amber-900/10 hover:border-amber-900/30 transition-all list-none">
    <div className="text-amber-500 mt-1">
      {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-5 h-5' })}
    </div>
    <div>
      <p className="text-white font-bold text-sm">{title}</p>
      <p className="text-stone-400 text-xs font-medium mt-1 leading-relaxed">{desc}</p>
    </div>
  </li>
);

export default AIInsights;