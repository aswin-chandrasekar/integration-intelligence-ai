import React from 'react';
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
  AlertCircle 
} from 'lucide-react';
import { motion } from 'motion/react';

const AIInsights: React.FC = () => {
  return (
    <div className="space-y-10">
      {/* Header */}
      <section className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight text-white">AI Insights</h1>
        <p className="text-stone-400 font-medium">Automated analysis of architectural patterns and integration risks.</p>
      </section>

      {/* Metrics Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Total Integrations" 
          value="142" 
          change="+12%" 
          trend="up" 
          icon={<Network className="text-amber-500" />} 
        />
        <MetricCard 
          title="Active Security Risks" 
          value="18" 
          change="+4" 
          trend="up" 
          badge="High" 
          icon={<ShieldAlert className="text-orange-500" />} 
        />
        <MetricCard 
          title="Architecture Score" 
          value="72" 
          suffix="/100" 
          progress={72} 
          icon={<Component className="text-stone-400" />} 
        />
        <MetricCard 
          title="Matching Confidence" 
          value="94%" 
          detail="Neural precision: high" 
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
            <PatternCard 
              title="Event-Driven Synchronization" 
              desc="Primary flow for high-scale messaging systems."
              locations="12 Locations Found"
              status="STABLE"
              icon={<RefreshCw />}
            />
            <PatternCard 
              title="Direct SQL Access" 
              desc="Found in legacy modules, bypasses API layers."
              locations="Technical Debt Flagged"
              status="RISK"
              isRisk
              icon={<Database />}
            />
            <PatternCard 
              title="Third-Party API Dependency" 
              desc="High reliance on Stripe and Twilio found across 8 core modules."
              fullWidth
              tags={['Stripe', 'Twilio']}
              icon={<Cloud />}
            />
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
                  <span className="text-4xl font-black text-white block">94.2</span>
                  <span className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">Global Precision</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <ConfidenceBar label="Data Mapping" value={98} />
              <ConfidenceBar label="Security Logic" value={89} />
              <ConfidenceBar label="Latency Prediction" value={92} />
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
              <RiskRow 
                type="Hardcoded API Credentials" 
                detail="Possible secrets exposure in code" 
                impact="CRITICAL" 
                evidence="src/auth/gatekeeper.js:142"
              />
              <RiskRow 
                type="Unencrypted Data Transfer" 
                detail="HTTP detected on internal microservice" 
                impact="HIGH" 
                evidence="config/network.yml:45"
              />
              <RiskRow 
                type="Stale Webhook Endpoint" 
                detail="No traffic detected in 30 days" 
                impact="LOW" 
                evidence="api/v1/webhooks/legacy"
                action="Archive"
              />
            </tbody>
          </table>
        </div>
      </section>

      {/* AI Optimization */}
      <section className="bg-amber-950/20 border border-amber-900/30 p-10 rounded-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
          <div className="flex-1 space-y-6">
            <div className="flex items-center gap-3 text-amber-500">
              <Lightbulb className="w-6 h-6 fill-current" />
              <h3 className="text-2xl font-bold">AI Optimization Recommendations</h3>
            </div>
            <div className="space-y-4">
              <RecommendationItem 
                icon={<Zap />} 
                title="Consolidate redundant Stripe API calls" 
                desc="The 'Checkout' and 'UserAccount' modules call Stripe's metadata endpoint separately. Move to a shared provider to save 200ms latency."
              />
              <RecommendationItem 
                icon={<AlertCircle />} 
                title="Implement circuit breaker for Twilio" 
                desc="Current integration lacks failure isolation. Implement a circuit breaker pattern to prevent cascading failures during Twilio outages."
              />
            </div>
          </div>
          
          <div className="w-full md:w-72 bg-[#1c1917] p-8 rounded-2xl shadow-2xl border border-stone-800 self-center text-center space-y-6">
            <span className="text-[10px] text-stone-500 uppercase font-black tracking-[0.2em] block">Potential Impact</span>
            <div className="text-5xl font-black text-amber-500 tracking-tighter">-1.4s</div>
            <p className="text-sm text-stone-400 font-medium">Total latency reduction across integration pipelines.</p>
            <button className="w-full py-4 bg-amber-600 text-white font-black rounded-xl hover:bg-amber-700 transition-all">Apply All</button>
          </div>
        </div>
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
        {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6' })}
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
      {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5' })}
    </div>
    <div>
      <p className="text-white font-bold text-sm">{title}</p>
      <p className="text-stone-400 text-xs font-medium mt-1 leading-relaxed">{desc}</p>
    </div>
  </li>
);

export default AIInsights;
