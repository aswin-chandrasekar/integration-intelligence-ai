/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Download, FileJson, FileSpreadsheet, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { TopNav, Sidebar } from './components/Navigation';
import ScanPanel from './components/ScanPanel';
import ResultsTable from './components/ResultsTable';
import AIInsights from './components/AIInsights';
import { getIntegrations, Integration } from './services/api';

export const runScan = async (repoPath: string) => {
  await fetch("/api/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repo_path: repoPath })
  })
}

export const getEdges = async () => {
  const res = await fetch("/api/edges")
  return res.json()
}

export default function App() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'dashboard' | 'insights'>('dashboard');

  const fetchIntegrations = async () => {
    try {
      const data = await getIntegrations();
      setIntegrations(data);
    } catch (error) {
      console.error('Failed to fetch integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  return (
    <div className="min-h-screen bg-[#0c0a09]">
      <TopNav />
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      
      <main className="lg:ml-72 p-8 min-h-[calc(100vh-64px)] overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          
          {currentView === 'dashboard' ? (
            <div className="space-y-12">
              {/* Page Header */}
              <header className="flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-white">Intelligence Dashboard</h1>
                  <p className="text-stone-500 mt-1 font-medium">Analysis overview for central-api-gateway repository</p>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-stone-900 text-emerald-500 text-sm font-bold rounded-full border border-stone-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  System Online
                </div>
              </header>

              {/* Bento Grid Layout */}
              <div className="grid grid-cols-12 gap-8">
                
                {/* 1. Repository Scan Section */}
                <div className="col-span-12 lg:col-span-7">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <ScanPanel onScanComplete={fetchIntegrations} />
                  </motion.div>
                </div>

                {/* 3. Graph View Section Placeholder */}
                <div className="col-span-12 lg:col-span-5 h-full">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="h-full bg-[#1c1917] border border-stone-800 rounded-xl p-8 flex flex-col justify-between shadow-sm relative overflow-hidden group"
                  >
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-4">
                        <Activity className="text-[#d97706] w-5 h-5" />
                        <h2 className="text-xl font-bold text-white">Graph View</h2>
                      </div>
                      <p className="text-sm text-stone-500 font-medium">
                        Visualize system dependencies and data flow across services.
                      </p>
                    </div>

                    <div className="mt-8 flex-1 w-full flex items-center justify-center border-2 border-dashed border-stone-800 rounded-xl bg-stone-900 group-hover:bg-amber-900/10 transition-all">
                      <div className="text-center">
                        <Activity className="w-12 h-12 text-stone-800 mx-auto mb-3" />
                        <p className="text-sm text-white font-bold">Dependency Graph</p>
                        <p className="text-xs text-stone-500 font-medium italic mt-1">Coming Soon</p>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Integration Catalog Section */}
                <div className="col-span-12">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                  >
                    <ResultsTable data={integrations} />
                  </motion.div>
                </div>

                {/* 4. Exports Section */}
                <div className="col-span-12">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="bg-[#1c1917] border border-stone-800 rounded-xl p-8 flex flex-col md:flex-row items-center justify-between shadow-sm"
                  >
                    <div className="flex items-center gap-4 mb-4 md:mb-0">
                      <div className="p-3 bg-stone-900 text-[#d97706] rounded-xl">
                        <Download className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">Data Exports</h2>
                        <p className="text-sm text-stone-500 font-medium">Download discovered integration metadata in various formats.</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-4 flex-wrap w-full md:w-auto">
                      <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 border border-stone-800 rounded-xl text-stone-600 font-bold text-sm bg-stone-900/50 cursor-not-allowed transition-all" disabled>
                        <FileSpreadsheet className="w-4 h-4" />
                        Export CSV
                      </button>
                      <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 border border-stone-800 rounded-xl text-stone-600 font-bold text-sm bg-stone-900/50 cursor-not-allowed transition-all" disabled>
                        <FileJson className="w-4 h-4" />
                        Export JSON
                      </button>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <AIInsights />
            </motion.div>
          )}

        </div>
      </main>
    </div>
  );
}
