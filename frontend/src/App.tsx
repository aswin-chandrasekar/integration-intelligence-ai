/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import {Download,FileJson,FileSpreadsheet,Activity} from 'lucide-react';
import { motion } from 'motion/react';
import { TopNav, Sidebar } from './components/Navigation';
import ScanPanel from './components/ScanPanel';
import ResultsTable from './components/ResultsTable';
import AIInsights from './components/AIInsights';
import {getIntegrations,Integration,exportMermaid} from './services/api';
import GraphView from "./components/GraphView.tsx";

export default function App() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] =
    useState<'dashboard' | 'insights'>('dashboard');
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

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
  const handleSectionClick = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth'
      });
    }
  };

  // =========================
  // EXPORTS
  // =========================

  const handleMermaidExport = async () => {
    try {
      const result = await exportMermaid(selectedSystem || undefined);

      const blob = new Blob([result.diagram], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "architecture-diagram.mmd";
      a.click();
      URL.revokeObjectURL(url);

      setNotification({ message: "Mermaid diagram downloaded!", type: 'success' });
    } catch (err) {
      console.error("Mermaid export failed:", err);
      setNotification({ message: "Mermaid export failed", type: 'error' });
    }
  };

  useEffect(() => {
    if (!notification) return;
    const timer = window.setTimeout(() => setNotification(null), 3000);
    return () => window.clearTimeout(timer);
  }, [notification]);

  const handleJsonExport = () => {
    const blob = new Blob(
      [JSON.stringify(integrations, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "integration-inventory.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCsvExport = () => {

    const headers = ["Source","Target","Type","File","Line","Confidence"];
    const rows = integrations.map((i: any) => [
      i.source,
      i.target,
      i.type,
      i.file || "",
      i.line || "",
      i.confidence || ""
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(","))
    ].join("\n");
    const blob = new Blob(
      [csvContent],
      { type: "text/csv;charset=utf-8;" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "integration-inventory.csv";
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="min-h-screen bg-[#0c0a09]">
      <TopNav />
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        onSectionClick={handleSectionClick}
      />
      {notification && (
        <div className={`fixed right-6 top-24 z-50 rounded-2xl px-4 py-3 shadow-xl ${notification.type === 'success' ? 'bg-emerald-500 text-black' : 'bg-rose-500 text-white'}`}>
          {notification.message}
        </div>
      )}
      <main className="lg:ml-72 p-8 min-h-[calc(100vh-64px)] overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {currentView === 'dashboard' ? (
            <div className="space-y-12">
              {/* Header */}
              <header className="flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-white">
                    Intelligence Dashboard
                  </h1>
                  <p className="text-stone-500 mt-1 font-medium">
                    Analysis overview for central-api-gateway repository
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-stone-900 text-emerald-500 text-sm font-bold rounded-full border border-stone-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  System Online
                </div>
              </header>
              {/* Grid */}
              <div className="grid grid-cols-12 gap-8">
                {/* Scan */}
                <div className="col-span-12" id="scan-section">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <ScanPanel onScanComplete={fetchIntegrations} />
                  </motion.div>
                </div>
                {/* Graph */}
                <div className="col-span-12 h-full" id="graph-section">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="h-full bg-[#1c1917] border border-stone-800 rounded-xl p-8 flex flex-col justify-between shadow-sm relative overflow-hidden"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <Activity className="text-[#d97706] w-5 h-5" />
                        <h2 className="text-xl font-bold text-white">
                          Graph View
                        </h2>
                      </div>
                      <p className="text-sm text-stone-500 font-medium">
                        Visualize system dependencies and data flow across services.
                      </p>
                    </div>
                    <div className="mt-8 flex-1 w-full border border-stone-800 rounded-xl bg-stone-900 overflow-hidden">
                      <GraphView
                        data={integrations}
                        onSelectedSystemChange={setSelectedSystem}
                      />
                    </div>
                  </motion.div>
                </div>
                {/* Catalog */}
                <div className="col-span-12" id="catalog-section">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                  >
                    <ResultsTable data={integrations} />
                  </motion.div>
                </div>
                {/* Exports */}
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
                        <h2 className="text-xl font-bold text-white">
                          Data Exports
                        </h2>
                        <p className="text-sm text-stone-500 font-medium">
                          Download discovered integration metadata in various formats.
                        </p>
                      </div>
                    </div>
                    {/* Export Buttons */}
                    <div className="flex gap-4 flex-wrap w-full md:w-auto">
                      <button
                        onClick={handleCsvExport}
                        className="flex items-center justify-center gap-2 px-6 py-3 border border-stone-700 rounded-xl text-white font-bold text-sm bg-stone-900 hover:bg-stone-800 transition-all"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        Export CSV
                      </button>
                      <button
                        onClick={handleJsonExport}
                        className="flex items-center justify-center gap-2 px-6 py-3 border border-stone-700 rounded-xl text-white font-bold text-sm bg-stone-900 hover:bg-stone-800 transition-all"
                      >
                        <FileJson className="w-4 h-4" />
                        Export JSON
                      </button>
                      <button
                        onClick={handleMermaidExport}
                        className="flex items-center justify-center gap-2 px-6 py-3 border border-amber-700 rounded-xl text-white font-bold text-sm bg-amber-700 hover:bg-amber-600 transition-all"
                      >
                        <Download className="w-4 h-4" />
                        Export Mermaid
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
              <AIInsights
                onNavigateToDashboard={() => setCurrentView('dashboard')}
                onNavigateToSection={handleSectionClick}
                integrations={integrations}
              />
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}