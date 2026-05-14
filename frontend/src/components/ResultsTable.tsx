import React from 'react';
import { Database, Verified, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { Integration } from '../services/api';

interface Props {
  data: Integration[];
}

const ResultsTable: React.FC<Props> = ({ data }) => {
  return (
    <section className="bg-app-surface border border-app-border rounded-xl shadow-sm overflow-hidden transition-colors">
      <div className="p-6 border-b border-app-border flex justify-between items-center bg-app-surface">
        <div className="flex items-center gap-2">
          <Database className="text-app-text-muted w-5 h-5" />
          <h2 className="text-xl font-bold text-app-text">Integration Catalog</h2>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-1.5 text-sm font-medium border border-app-border rounded-lg hover:bg-app-surface-hover transition-colors text-app-text cursor-pointer">
            Filter
          </button>
          <button className="px-4 py-1.5 text-sm font-medium border border-app-border rounded-lg hover:bg-app-surface-hover transition-colors text-app-text cursor-pointer">
            Sort
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-app-bg border-b border-app-border">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-app-text-muted uppercase tracking-widest">Source System</th>
              <th className="px-6 py-4 text-[10px] font-black text-app-text-muted uppercase tracking-widest">Target System</th>
              <th className="px-6 py-4 text-[10px] font-black text-app-text-muted uppercase tracking-widest">Type</th>
              <th className="px-6 py-4 text-[10px] font-black text-app-text-muted uppercase tracking-widest">Evidence (File:Line)</th>
              <th className="px-6 py-4 text-[10px] font-black text-app-text-muted uppercase tracking-widest">Confidence / Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-app-border">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-app-surface-hover/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      item.color === 'blue' ? 'bg-amber-500' :
                      item.color === 'purple' ? 'bg-purple-500' :
                      item.color === 'orange' ? 'bg-orange-500' : 'bg-cyan-500'
                    } shadow-sm`}></span>
                    <span className="text-sm font-bold text-app-text">{item.source}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-app-text-muted font-medium">{item.target}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${
                    item.color === 'blue' ? 'bg-amber-500/10 text-amber-600' :
                    item.color === 'purple' ? 'bg-purple-500/10 text-purple-600' :
                    item.color === 'orange' ? 'bg-orange-500/10 text-orange-600' : 'bg-cyan-500/10 text-cyan-600'
                  }`}>
                    {item.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs font-mono text-app-text-muted">{item.evidence}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-app-text font-medium">{item.confidence || 'N/A'}</span>
                    {item.confidence?.includes('98') ? (
                      <Verified className="text-emerald-500 w-4 h-4 fill-emerald-500/10" />
                    ) : (
                      <Info className="text-app-text-muted w-4 h-4" />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 bg-app-bg flex justify-between items-center px-6 border-t border-app-border transition-colors">
        <p className="text-[10px] font-black text-app-text-muted uppercase tracking-widest">Showing {data.length} discovered integrations</p>

        <div className="flex gap-2">
          <button className="p-1.5 border border-app-border rounded hover:bg-app-surface-hover transition-colors cursor-pointer">
            <ChevronLeft className="w-4 h-4 text-app-text-muted" />
          </button>
          <button className="p-1.5 border border-app-border rounded hover:bg-app-surface-hover transition-colors cursor-pointer">
            <ChevronRight className="w-4 h-4 text-app-text-muted" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default ResultsTable;
