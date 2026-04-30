import React from 'react';
import { Database, Verified, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { Integration } from '../services/api';

interface Props {
  data: Integration[];
}

const ResultsTable: React.FC<Props> = ({ data }) => {
  return (
    <section className="bg-[#1c1917] border border-stone-800 rounded-xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-stone-800 flex justify-between items-center bg-[#1c1917]">
        <div className="flex items-center gap-2">
          <Database className="text-stone-500 w-5 h-5" />
          <h2 className="text-xl font-bold text-white">Integration Catalog</h2>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-1.5 text-sm font-medium border border-stone-800 rounded-lg hover:bg-stone-900 transition-colors text-stone-300">
            Filter
          </button>
          <button className="px-4 py-1.5 text-sm font-medium border border-stone-800 rounded-lg hover:bg-stone-900 transition-colors text-stone-300">
            Sort
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#0c0a09] border-b border-stone-800">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-stone-500 uppercase tracking-widest">Source System</th>
              <th className="px-6 py-4 text-[10px] font-black text-stone-500 uppercase tracking-widest">Target System</th>
              <th className="px-6 py-4 text-[10px] font-black text-stone-500 uppercase tracking-widest">Type</th>
              <th className="px-6 py-4 text-[10px] font-black text-stone-500 uppercase tracking-widest">Evidence (File:Line)</th>
              <th className="px-6 py-4 text-[10px] font-black text-stone-500 uppercase tracking-widest">Confidence / Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-stone-900/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      item.color === 'blue' ? 'bg-amber-500' :
                      item.color === 'purple' ? 'bg-purple-500' :
                      item.color === 'orange' ? 'bg-orange-500' : 'bg-cyan-500'
                    } shadow-sm`}></span>
                    <span className="text-sm font-bold text-white">{item.source}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-stone-400 font-medium">{item.target}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${
                    item.color === 'blue' ? 'bg-amber-950/30 text-amber-500' :
                    item.color === 'purple' ? 'bg-purple-950/30 text-purple-500' :
                    item.color === 'orange' ? 'bg-orange-950/30 text-orange-500' : 'bg-cyan-950/30 text-cyan-500'
                  }`}>
                    {item.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs font-mono text-stone-600">{item.evidence}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white font-medium">{item.confidence || 'N/A'}</span>
                    {item.confidence?.includes('98') ? (
                      <Verified className="text-emerald-500 w-4 h-4 fill-emerald-950/20" />
                    ) : (
                      <Info className="text-stone-700 w-4 h-4" />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 bg-[#0c0a09] flex justify-between items-center px-6 border-t border-stone-800">
        <p className="text-[10px] font-black text-stone-600 uppercase tracking-widest">Showing {data.length} discovered integrations</p>

        <div className="flex gap-2">
          <button className="p-1.5 border border-stone-800 rounded hover:bg-stone-900 transition-colors">
            <ChevronLeft className="w-4 h-4 text-stone-500" />
          </button>
          <button className="p-1.5 border border-stone-800 rounded hover:bg-stone-900 transition-colors">
            <ChevronRight className="w-4 h-4 text-stone-500" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default ResultsTable;
