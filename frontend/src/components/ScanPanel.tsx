import React, { useState, useEffect } from 'react';
import { Play, Search, Loader2 } from 'lucide-react';
import { scanRepository, getScanStatus } from '../services/api';

interface ScanPanelProps {
  onScanComplete?: () => void;
}

const ScanPanel: React.FC<ScanPanelProps> = ({ onScanComplete }) => {
  const [repoPath, setRepoPath] = useState('');
  const [status, setStatus] = useState('Idle');
  const [loading, setLoading] = useState(false);

  const handleScan = async () => {
    if (!repoPath) return;
    setLoading(true);
    setStatus('Scanning');
    try {
      await scanRepository(repoPath);
    } catch (error) {
      setStatus('Error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let interval: any;
    if (status === 'Scanning') {
      interval = setInterval(async () => {
        const res = await getScanStatus();
        setStatus(res.status);
        if (res.status === 'Completed') {
          clearInterval(interval);
          if (onScanComplete) {
            onScanComplete();
          }
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [status, onScanComplete]);

  const getStatusColor = () => {
    switch (status) {
      case 'Scanning': return 'bg-secondary-fixed animate-pulse';
      case 'Completed': return 'bg-emerald-500';
      case 'Error': return 'bg-error';
      default: return 'bg-gray-300';
    }
  };

  return (
    <section className="bg-[#1c1917] border border-stone-800 rounded-xl p-8 space-y-8 shadow-sm">
      <div className="flex items-center gap-3">
        <Search className="text-[#d97706] w-6 h-6" />
        <h2 className="text-2xl font-bold text-white">Repository Scan</h2>
      </div>
      
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] uppercase font-black text-stone-500 tracking-widest">Repo Path / Repo URL</label>
          <input 
            type="text" 
            value={repoPath}
            onChange={(e) => setRepoPath(e.target.value)}
            className="w-full border border-stone-800 rounded-xl focus:ring-[#d97706] focus:border-[#d97706] text-sm px-5 py-3.5 bg-stone-950 text-stone-200 placeholder:text-stone-700 transition-all"
            placeholder="https://github.com/org/central-api-gateway"
          />
        </div>

        <div className="flex items-center justify-between gap-6 pt-2">
          <button 
            onClick={handleScan}
            disabled={loading || status === 'Scanning'}
            className="bg-[#d97706] text-white px-10 py-3.5 rounded-xl font-bold text-sm hover:bg-amber-700 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-900/20 active:scale-95"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
            Run Scan
          </button>
          
          <div className="flex items-center gap-4 px-5 py-3.5 bg-stone-900 rounded-xl border border-stone-800 flex-1">
            <span className={`w-2.5 h-2.5 rounded-full ${getStatusColor()}`}></span>
            <span className="text-sm text-stone-400 font-medium">Status: <span className="text-white font-black">{status}</span></span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ScanPanel;
