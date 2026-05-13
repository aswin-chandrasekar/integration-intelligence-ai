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

  // Calculate metrics based on integrations data
  const calculateMetrics = (integrations: any[]) => {
    const totalIntegrations = integrations.length;

    // Calculate architecture score based on integration patterns
    const syncIntegrations = integrations.filter(i => i.type === 'SYNC_API').length;
    const dbIntegrations = integrations.filter(i => i.type === 'DB').length;
    const fileIntegrations = integrations.filter(i => i.type === 'FILE').length;

    // Architecture score: higher is better (100 - penalties for risky patterns)
    let architectureScore = 100;
    architectureScore -= syncIntegrations * 2; // Penalty for sync APIs
    architectureScore -= dbIntegrations * 3; // Penalty for direct DB access
    architectureScore -= fileIntegrations * 1; // Penalty for file-based integrations
    architectureScore = Math.max(0, Math.min(100, architectureScore));

    // Calculate security risks based on patterns
    let securityRisks = 0;
    if (dbIntegrations > 0) securityRisks += dbIntegrations; // Direct DB access is a risk
    if (fileIntegrations > 0) securityRisks += Math.floor(fileIntegrations / 2); // File access can be risky
    if (syncIntegrations > 10) securityRisks += 5; // Too many sync integrations

    // Calculate matching confidence based on evidence quality
    const avgConfidence = integrations.length > 0
      ? integrations.reduce((sum, i) => {
          const confidence = i.confidence || '0%';
          const match = confidence.match(/(\d+)/);
          return sum + (match ? parseInt(match[1]) : 0);
        }, 0) / integrations.length
      : 0;

    // Generate architectural patterns
    const patterns = [];

    // Event-Driven Synchronization
    const hasEventDriven = integrations.some(i => i.type === 'PUB_SUB' || i.type === 'ASYNC_API');
    if (hasEventDriven || syncIntegrations < totalIntegrations * 0.3) {
      patterns.push({
        title: "Event-Driven Synchronization",
        desc: hasEventDriven ? "Primary flow for high-scale messaging systems." : "Limited synchronous coupling detected.",
        locations: hasEventDriven ? `${integrations.filter(i => i.type === 'PUB_SUB' || i.type === 'ASYNC_API').length} Locations Found` : "Recommended Pattern",
        status: hasEventDriven ? "STABLE" : "OPTIMAL",
        icon: "RefreshCw"
      });
    }

    // Direct SQL Access
    if (dbIntegrations > 0) {
      patterns.push({
        title: "Direct SQL Access",
        desc: "Found in legacy modules, bypasses API layers.",
        locations: `${dbIntegrations} Locations Found`,
        status: "RISK",
        isRisk: true,
        icon: "Database"
      });
    }

    // Third-Party API Dependency
    const thirdPartyAPIs = integrations.filter(i =>
      i.target && (i.target.toLowerCase().includes('stripe') ||
                   i.target.toLowerCase().includes('twilio') ||
                   i.target.toLowerCase().includes('aws') ||
                   i.target.toLowerCase().includes('google'))
    );
    if (thirdPartyAPIs.length > 0) {
      patterns.push({
        title: "Third-Party API Dependency",
        desc: `High reliance on external services found across ${thirdPartyAPIs.length} integrations.`,
        fullWidth: true,
        tags: [...new Set(thirdPartyAPIs.map(i => i.target.split('.')[0]))],
        icon: "Cloud"
      });
    }

    // Calculate confidence index
    const confidenceIndex = {
      globalPrecision: Math.round(avgConfidence),
      dataMapping: Math.round(avgConfidence * 1.1),
      securityLogic: Math.round(85 + (avgConfidence * 0.1)),
      latencyPrediction: Math.round(88 + (avgConfidence * 0.1))
    };

    // Generate security risks
    const risks = [];
    if (dbIntegrations > 0) {
      risks.push({
        type: "Direct Database Access",
        detail: `${dbIntegrations} direct database connections detected`,
        impact: dbIntegrations > 3 ? "CRITICAL" : "HIGH",
        evidence: "Multiple integration points",
        action: "Implement API abstraction layer"
      });
    }

    if (fileIntegrations > 0) {
      risks.push({
        type: "File-Based Integration",
        detail: `${fileIntegrations} file-based integrations found`,
        impact: "MEDIUM",
        evidence: "File system dependencies",
        action: "Migrate to API-based integration"
      });
    }

    if (syncIntegrations > 10) {
      risks.push({
        type: "High Synchronous Coupling",
        detail: `${syncIntegrations} synchronous integrations may cause cascading failures`,
        impact: "HIGH",
        evidence: "Architecture analysis",
        action: "Implement circuit breakers"
      });
    }

    // Generate recommendations
    const recommendations = [];
    if (dbIntegrations > 0) {
      recommendations.push({
        icon: "Database",
        title: "Implement Database Abstraction Layer",
        desc: `Replace ${dbIntegrations} direct database connections with API-based access patterns.`
      });
    }

    if (syncIntegrations > totalIntegrations * 0.5) {
      recommendations.push({
        icon: "Zap",
        title: "Reduce Synchronous Dependencies",
        desc: `Convert ${Math.floor(syncIntegrations * 0.3)} synchronous integrations to event-driven patterns.`
      });
    }

    return {
      metrics: {
        totalIntegrations: { value: totalIntegrations, change: "+0%", trend: "up" },
        activeSecurityRisks: {
          value: securityRisks,
          change: securityRisks > 5 ? "+High" : "+Low",
          trend: securityRisks > 5 ? "up" : "stable",
          badge: securityRisks > 10 ? "Critical" : securityRisks > 5 ? "High" : "Medium"
        },
        architectureScore: { value: architectureScore, progress: architectureScore, suffix: "/100" },
        matchingConfidence: {
          value: `${Math.round(avgConfidence)}${avgConfidence > 90 ? ' (High)' : avgConfidence > 70 ? ' (Medium)' : ' (Low)'}`,
          detail: `Neural precision: ${avgConfidence > 90 ? 'high' : avgConfidence > 70 ? 'medium' : 'low'}`,
          suffix: "%"
        }
      },
      patterns,
      confidenceIndex,
      risks,
      recommendations
    };
  };

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const response = await fetch('/api/insights');
        const jsonData = await response.json();
        setData(jsonData);
      } catch (error) {
        console.error('Error fetching insights:', error);
        // Fallback to calculated data
        setData(calculateMetrics(integrations));
      }
    };

    // Use calculated data if we have integrations, otherwise fetch from API
    if (integrations.length > 0) {
      setData(calculateMetrics(integrations));
    } else {
      fetchInsights();
    }
  }, [integrations]);

  return (
    <div className="space-y-10">
      {/* Header */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">AI Insights</h1>
            <p className="text-stone-400 font-medium">Automated analysis of architectural patterns and integration risks.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onNavigateToDashboard}
              className="flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </button>
            <button
              onClick={() => onNavigateToSection?.('graph-section')}
              className="flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Activity className="w-4 h-4" />
              Graph View
            </button>
            <button
              onClick={() => onNavigateToSection?.('catalog-section')}
              className="flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <DatabaseIcon className="w-4 h-4" />
              Catalog
            </button>
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
          icon={<Network className="text-amber-500" />} 
        />
        <MetricCard 
          title="Active Security Risks" 
          value={data.metrics.activeSecurityRisks.value.toString()} 
          change={data.metrics.activeSecurityRisks.change} 
          trend={data.metrics.activeSecurityRisks.trend} 
          badge={data.metrics.activeSecurityRisks.badge} 
          icon={<ShieldAlert className="text-orange-500" />} 
        />
        <MetricCard 
          title="Architecture Score" 
          value={data.metrics.architectureScore.value.toString()} 
          suffix={data.metrics.architectureScore.suffix} 
          progress={data.metrics.architectureScore.progress} 
          icon={<Component className="text-stone-400" />} 
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
            <h2 className="text-2xl font-bold text-white">Architectural Patterns</h2>
            <button className="text-amber-500 font-bold text-sm hover:underline">View all maps</button>
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
          <h2 className="text-2xl font-bold text-white">Confidence Index</h2>
          <div className="bg-[#1c1917] border border-stone-800 p-8 rounded-xl space-y-8">
            <div className="flex flex-col items-center justify-center py-6 relative">
              <div className="w-40 h-40 rounded-full border-8 border-stone-900 flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full border-8 border-amber-600 border-t-transparent border-r-transparent transform -rotate-12"></div>
                <div className="text-center">
                  <span className="text-4xl font-black text-white block">{data.confidenceIndex.globalPrecision}</span>
                  <span className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">Global Precision</span>
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
          <h2 className="text-2xl font-bold text-white">Security & Risk Audit</h2>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-stone-800 rounded-lg text-sm font-bold text-stone-300 hover:bg-stone-900">Export Report</button>
            <button className="px-6 py-2 bg-amber-600 text-white rounded-lg text-sm font-bold hover:bg-amber-700">Full Scan</button>
          </div>
        </div>
        
        <div className="bg-[#1c1917] border border-stone-800 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#0c0a09] border-b border-stone-800">
              <tr>
                <th className="px-8 py-4 text-[10px] font-black text-stone-500 uppercase tracking-widest">Risk Type</th>
                <th className="px-8 py-4 text-[10px] font-black text-stone-500 uppercase tracking-widest">Impact</th>
                <th className="px-8 py-4 text-[10px] font-black text-stone-500 uppercase tracking-widest">Evidence</th>
                <th className="px-8 py-4 text-[10px] font-black text-stone-500 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
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
    </div>
  );
};

const MetricCard: React.FC<{ title: string; value: string; suffix?: string; change?: string; trend?: string; progress?: number; detail?: string; badge?: string; icon: React.ReactNode }> = ({ title, value, suffix, change, trend, progress, detail, badge, icon }) => (
  <div className="bg-[#1c1917] border border-stone-800 p-6 rounded-xl flex flex-col justify-between h-40">
    <div className="flex justify-between items-start">
      <span className="text-stone-500 font-bold text-xs uppercase tracking-wider">{title}</span>
      {badge ? (
        <span className="bg-orange-950 text-orange-500 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest">{badge}</span>
      ) : icon}
    </div>
    <div className="mt-4">
      <div className="text-3xl font-black text-white">
        {value}{suffix && <span className="text-xl text-stone-600 ml-1">{suffix}</span>}
      </div>
      {change && (
        <div className={`text-xs font-bold mt-1 ${trend === 'up' ? 'text-amber-500' : 'text-stone-500'}`}>
          {change} <span className="text-stone-600 font-medium ml-1">from last scan</span>
        </div>
      )}
      {progress !== undefined && (
        <div className="w-full bg-stone-900 h-1.5 rounded-full mt-3 overflow-hidden">
          <div className="bg-amber-600 h-full rounded-full" style={{ width: `${progress}%` }}></div>
        </div>
      )}
      {detail && <div className="text-xs text-stone-500 font-medium mt-1">{detail}</div>}
    </div>
  </div>
);

const PatternCard: React.FC<{ title: string; desc: string; locations?: string; status?: string; isRisk?: boolean; fullWidth?: boolean; tags?: string[]; icon: React.ReactNode }> = ({ title, desc, locations, status, isRisk, fullWidth, tags, icon }) => (
  <div className={`bg-[#1c1917] border border-stone-800 p-6 rounded-xl space-y-4 ${fullWidth ? 'md:col-span-2' : ''}`}>
    <div className="flex items-start gap-4">
      <div className={`p-3 rounded-xl ${isRisk ? 'bg-orange-950/30 text-orange-500' : 'bg-stone-900 text-amber-500'}`}>
        {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-6 h-6' })}
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-bold text-white">{title}</h4>
        <p className="text-xs text-stone-500 font-medium leading-relaxed">{desc}</p>
        {tags && (
          <div className="flex gap-2 mt-4">
            {tags.map(tag => (
              <div key={tag} className="flex items-center gap-1.5 bg-stone-900 px-3 py-1 rounded-full text-[10px] font-bold text-stone-400">
                <span className={`w-1.5 h-1.5 rounded-full ${tag === 'Stripe' ? 'bg-amber-500' : 'bg-orange-500'}`}></span>
                {tag}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    {(locations || status) && (
      <div className="flex justify-between items-center pt-4 border-t border-stone-800">
        <span className={`text-[10px] font-black uppercase tracking-widest ${isRisk ? 'text-orange-500' : 'text-stone-600'}`}>{locations}</span>
        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${isRisk ? 'bg-orange-600 text-white' : 'bg-stone-900 text-stone-400'}`}>{status}</span>
      </div>
    )}
  </div>
);

const ConfidenceBar: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest">
      <span className="text-stone-500">{label}</span>
      <span className="text-white">{value}%</span>
    </div>
    <div className="h-1 bg-stone-900 rounded-full overflow-hidden">
      <div className="bg-amber-600 h-full" style={{ width: `${value}%` }}></div>
    </div>
  </div>
);

const RiskRow: React.FC<{ type: string; detail: string; impact: string; evidence: string; action?: string }> = ({ type, detail, impact, evidence, action = 'Dismiss' }) => (
  <tr className="hover:bg-stone-900/50 transition-colors">
    <td className="px-8 py-4">
      <div className="flex flex-col">
        <span className="text-sm font-bold text-white">{type}</span>
        <span className="text-xs text-stone-500 font-medium">{detail}</span>
      </div>
    </td>
    <td className="px-8 py-4">
      <span className={`px-2 py-0.5 text-[10px] font-black rounded ${
        impact === 'CRITICAL' ? 'bg-orange-950 text-orange-500' : 
        impact === 'HIGH' ? 'bg-amber-950 text-amber-500' : 'bg-stone-800 text-stone-500'
      }`}>{impact}</span>
    </td>
    <td className="px-8 py-4">
      <a className="text-amber-500 hover:underline text-xs font-bold flex items-center gap-1.5" href="#">
        <Link className="w-3.5 h-3.5" />
        {evidence}
      </a>
    </td>
    <td className="px-8 py-4 text-right">
      <button className="text-amber-500 font-black text-[10px] uppercase tracking-widest hover:text-amber-400">{action}</button>
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
