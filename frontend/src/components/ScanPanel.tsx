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
      case 'Scanning': return 'bg-app-brand animate-pulse';
      case 'Completed': return 'bg-emerald-500';
      case 'Error': return 'bg-rose-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <section className="bg-app-surface border border-app-border rounded-xl p-8 space-y-8 shadow-sm transition-colors">
      <div className="flex items-center gap-3">
        <Search className="text-app-brand w-6 h-6" />
        <h2 className="text-2xl font-bold text-app-text">Repository Scan</h2>
      </div>
      
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] uppercase font-black text-app-text-muted tracking-widest">Repo Path / Repo URL</label>
          <input 
            type="text" 
            value={repoPath}
            onChange={(e) => setRepoPath(e.target.value)}
            className="w-full border border-app-border rounded-xl focus:ring-app-brand focus:border-app-brand text-sm px-5 py-3.5 bg-app-bg text-app-text placeholder:text-app-text-muted transition-all outline-none"
            placeholder="https://github.com/org/central-api-gateway"
          />
        </div>

        <div className="flex items-center justify-between gap-6 pt-2">
          <button 
            onClick={handleScan}
            disabled={loading || status === 'Scanning'}
            className="bg-app-brand text-white px-10 py-3.5 rounded-xl font-bold text-sm hover:bg-app-brand-hover transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-app-brand/20 active:scale-95 cursor-pointer"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
            Run Scan
          </button>
          
          <div className="flex items-center gap-4 px-5 py-3.5 bg-app-surface-hover rounded-xl border border-app-border flex-1 transition-colors">
            <span className={`w-2.5 h-2.5 rounded-full ${getStatusColor()}`}></span>
            <span className="text-sm text-app-text-muted font-medium">Status: <span className="text-app-text font-black">{status}</span></span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ScanPanel;
