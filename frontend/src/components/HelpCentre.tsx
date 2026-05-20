import React from 'react';
import { HelpCircle, BookOpen, Info, ShieldAlert, Compass } from 'lucide-react';

const HelpCentre: React.FC = () => {
  return (
    <div className="space-y-12">
      {/* Header */}
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-app-text flex items-center gap-3">
            <HelpCircle className="w-8 h-8 text-app-brand" />
            Help Centre & User Manual
          </h1>
          <p className="text-app-text-muted mt-1 font-medium">
            Everything you need to know about using Integration Intelligence AI
          </p>
        </div>
      </header>

      {/* Manual Content Area */}
      <div className="grid grid-cols-12 gap-8">

        {/* User Section 1: Getting Started */}
        <section className="col-span-12 md:col-span-6 bg-app-surface border border-app-border rounded-xl p-8 space-y-4 shadow-sm transition-colors">
          <div className="flex items-center gap-3 border-b border-app-border pb-4">
            <BookOpen className="text-app-brand w-6 h-6" />
            <h2 className="text-xl font-bold text-app-text">1. Getting Started</h2>
          </div>

          <div className="text-app-text-muted space-y-4 text-sm leading-relaxed">
            {/* 
              ==========================================================
              PLACEHOLDER: ADD YOUR "GETTING STARTED" CONTENT BELOW HERE
              ==========================================================
            */}
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-app-text">Step 1:</strong> Enter your repository URL or local path in the Repository Scan panel.
              </li>
              <li>
                <strong className="text-app-text">Step 2:</strong> Click "Run Scan" and wait for completion.
              </li>
              <li>
                <strong className="text-app-text">Step 3:</strong> Explore the visual graph and integration catalog.
              </li>
            </ul>
            <div className="p-4 bg-app-bg rounded-lg border border-app-border border-dashed text-center italic text-app-text-muted/80 text-xs mt-4">
              Use the sidebar to navigate through different sections of this application.
            </div>
            {/* 
              ==========================================================
              END OF "GETTING STARTED" CONTENT SECTION
              ==========================================================
            */}
          </div>
        </section>

        {/* User Section 2: Features Overview */}
        <section className="col-span-12 md:col-span-6 bg-app-surface border border-app-border rounded-xl p-8 space-y-4 shadow-sm transition-colors">
          <div className="flex items-center gap-3 border-b border-app-border pb-4">
            <Compass className="text-app-brand w-6 h-6" />
            <h2 className="text-xl font-bold text-app-text">2. Features Overview</h2>
          </div>

          <div className="text-app-text-muted space-y-4 text-sm leading-relaxed">
            {/* 
              ==========================================================
              PLACEHOLDER: ADD YOUR "FEATURES" CONTENT BELOW HERE
              ==========================================================
            */}
            <div className="space-y-3">
              <div>
                <h4 className="font-bold text-app-text">Intelligence Dashboard</h4>
                <p>Overview of standard system metrics and active repositories.</p>
              </div>
              <div>
                <h4 className="font-bold text-app-text">Interactive Graph View</h4>
                <p>Visualize real-time mapping of services and databases dynamically.</p>
              </div>
              <div>
                <h4 className="font-bold text-app-text">AI Insights</h4>
                <p>Generate predictive insights and anomaly detection on integrated workflows.</p>
              </div>
            </div>
            <div className="p-4 bg-app-bg rounded-lg border border-app-border border-dashed text-center italic text-app-text-muted/80 text-xs mt-4">
              Switch to light mode/dark mode according to your preference
            </div>
            {/* 
              ==========================================================
              END OF "FEATURES" CONTENT SECTION
              ==========================================================
            */}
          </div>
        </section>

        {/* User Section 3: Frequently Asked Questions */}
        <section className="col-span-12 md:col-span-6 bg-app-surface border border-app-border rounded-xl p-8 space-y-4 shadow-sm transition-colors">
          <div className="flex items-center gap-3 border-b border-app-border pb-4">
            <Info className="text-app-brand w-6 h-6" />
            <h2 className="text-xl font-bold text-app-text">3. Frequently Asked Questions (FAQ)</h2>
          </div>

          <div className="text-app-text-muted space-y-4 text-sm leading-relaxed">
            {/* 
              ==========================================================
              PLACEHOLDER: ADD YOUR "FAQ" CONTENT BELOW HERE
              ==========================================================
            */}
            <div className="space-y-3">
              <details className="group border border-app-border bg-app-bg rounded-lg p-3">
                <summary className="font-bold text-app-text cursor-pointer list-none flex justify-between items-center">
                  <span>How do I export data?</span>
                  <span className="transition group-open:rotate-180">▼</span>
                </summary>
                <p className="mt-2 text-xs text-app-text-muted">You can use the "Data Exports" section at the bottom of the main dashboard to export to CSV, JSON, or Mermaid formats.</p>
              </details>

              <details className="group border border-app-border bg-app-bg rounded-lg p-3">
                <summary className="font-bold text-app-text cursor-pointer list-none flex justify-between items-center">
                  <span>Can I connect external repositories?</span>
                  <span className="transition group-open:rotate-180">▼</span>
                </summary>
                <p className="mt-2 text-xs text-app-text-muted">Yes, you can provide absolute file system paths or accessible repository URLs in the scan panel input box.</p>
              </details>
            </div>
            <div className="p-4 bg-app-bg rounded-lg border border-app-border border-dashed text-center italic text-app-text-muted/80 text-xs mt-4">
              Stuck somewhere? Have a look at the Frequently Asked Questions(FAQ)
            </div>
            {/* 
              ==========================================================
              END OF "FAQ" CONTENT SECTION
              ==========================================================
            */}
          </div>
        </section>

        {/* User Section 4: Troubleshooting */}
        <section className="col-span-12 md:col-span-6 bg-app-surface border border-app-border rounded-xl p-8 space-y-4 shadow-sm transition-colors">
          <div className="flex items-center gap-3 border-b border-app-border pb-4">
            <ShieldAlert className="text-app-brand w-6 h-6" />
            <h2 className="text-xl font-bold text-app-text">4. Troubleshooting</h2>
          </div>

          <div className="text-app-text-muted space-y-4 text-sm leading-relaxed">
            {/* 
              ==========================================================
              PLACEHOLDER: ADD YOUR "TROUBLESHOOTING" CONTENT BELOW HERE
              ==========================================================
            */}

            <ul className="list-disc pl-5 space-y-2">
              <li>Check your network connection if external repositories fail to scan.</li>
              <li>Ensure appropriate file read permissions for local directory scans.</li>
              <li>Check server logs in the terminal for specific API errors.</li>
            </ul>
            <div className="p-4 bg-app-bg rounded-lg border border-app-border border-dashed text-center italic text-app-text-muted/80 text-xs mt-4">
              Encountering issues? Here are common troubleshooting steps.
            </div>
            {/* 
              ==========================================================
              END OF "TROUBLESHOOTING" CONTENT SECTION
              ==========================================================
            */}
          </div>
        </section>

      </div>
    </div>
  );
};

export default HelpCentre;
