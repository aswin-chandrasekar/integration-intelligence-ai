import React, { useState, useEffect, useMemo } from 'react';
import { Database, Verified, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { Integration } from '../services/api';

interface Props {
  data: Integration[];
}

const filterCategories = ['Source', 'Target', 'Type'] as const;
type FilterCategory = typeof filterCategories[number];
type SelectedFilters = Record<FilterCategory, string[]>;

const ResultsTable: React.FC<Props> = ({ data }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [activeFilterCategory, setActiveFilterCategory] = useState<FilterCategory | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<SelectedFilters>({
    Source: [],
    Target: [],
    Type: [],
  });
  const [sortOrder, setSortOrder] = useState<'confidenceDesc' | 'confidenceAsc' | null>(null);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [data, selectedFilters, sortOrder]);

  const availableFilters = useMemo(() => ({
    Source: Array.from(new Set(data.map((item) => item.source))).sort(),
    Target: Array.from(new Set(data.map((item) => item.target))).sort(),
    Type: Array.from(new Set(data.map((item) => item.type))).sort(),
  }), [data]);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchesSource =
        selectedFilters.Source.length === 0 || selectedFilters.Source.includes(item.source);
      const matchesTarget =
        selectedFilters.Target.length === 0 || selectedFilters.Target.includes(item.target);
      const matchesType =
        selectedFilters.Type.length === 0 || selectedFilters.Type.includes(item.type);

      return matchesSource && matchesTarget && matchesType;
    });
  }, [data, selectedFilters]);

  const sortedData = useMemo(() => {
    const normalizeConfidence = (value?: string) => {
      if (!value) return 0;
      const match = value.match(/(\d+(\.\d+)?)/);
      return match ? Number(match[1]) : 0;
    };

    const sorted = [...filteredData];

    if (sortOrder === 'confidenceDesc') {
      sorted.sort(
        (a, b) => normalizeConfidence(b.confidence) - normalizeConfidence(a.confidence),
      );
    } else if (sortOrder === 'confidenceAsc') {
      sorted.sort(
        (a, b) => normalizeConfidence(a.confidence) - normalizeConfidence(b.confidence),
      );
    }

    return sorted;
  }, [filteredData, sortOrder]);

  const totalItems = sortedData.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const displayPages = totalPages || 1;
  const currentPageAdjusted = Math.min(Math.max(currentPage, 1), displayPages);
  const startIndex = (currentPageAdjusted - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
  const paginatedData = sortedData.slice(startIndex, endIndex);

  const handlePrevious = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(prev + 1, displayPages));
  };

  const toggleFilterOption = (category: FilterCategory, value: string) => {
    setSelectedFilters((prev) => {
      const nextValues = new Set(prev[category]);
      if (nextValues.has(value)) {
        nextValues.delete(value);
      } else {
        nextValues.add(value);
      }

      return {
        ...prev,
        [category]: Array.from(nextValues),
      };
    });
  };

  return (
    <section className="bg-app-surface border border-app-border rounded-xl shadow-sm overflow-hidden transition-colors">
      <div className="p-6 border-b border-app-border flex justify-between items-center bg-app-surface">
        <div className="flex items-center gap-2">
          <Database className="text-app-text-muted w-5 h-5" />
          <h2 className="text-xl font-bold text-app-text">Integration Catalog</h2>
        </div>

        <div className="flex gap-2 items-start">
          <div className="relative">
            <button
              onClick={() => {
                setFilterMenuOpen((prev) => !prev);
                setSortMenuOpen(false);
              }}
              className="px-4 py-1.5 text-sm font-medium border border-app-border rounded-lg hover:bg-app-surface-hover transition-colors text-app-text cursor-pointer"
            >
              Filter
            </button>
            {filterMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-app-border bg-app-surface shadow-lg z-20">
                {filterCategories.map((category) => (
                  <div key={category} className="group relative border-b border-app-border last:border-b-0">
                    <button
                      onMouseEnter={() => setActiveFilterCategory(category)}
                      onClick={() => setActiveFilterCategory(category)}
                      className="w-full text-left px-4 py-3 text-sm font-medium text-app-text hover:bg-app-surface-hover transition-colors"
                    >
                      {category}
                    </button>
                    {activeFilterCategory === category && (
                      <div className="border-t border-app-border bg-app-surface">
                        <div className="max-h-64 overflow-y-auto">
                          {availableFilters[category].map((value) => (
                            <label
                              key={value}
                              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-app-surface-hover cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedFilters[category].includes(value)}
                                onChange={() => toggleFilterOption(category, value)}
                                className="h-4 w-4 rounded border-app-border text-app-text"
                              />
                              <span className="truncate">{value}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => {
                setSortMenuOpen((prev) => !prev);
                setFilterMenuOpen(false);
              }}
              className="px-4 py-1.5 text-sm font-medium border border-app-border rounded-lg hover:bg-app-surface-hover transition-colors text-app-text cursor-pointer"
            >
              Sort
            </button>
            {sortMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-app-border bg-app-surface shadow-lg z-20">
                <button
                  onClick={() => setSortOrder('confidenceDesc')}
                  className="w-full text-left px-4 py-3 text-sm font-medium text-app-text hover:bg-app-surface-hover transition-colors"
                >
                  Confidence Score (High → Low)
                </button>
                <button
                  onClick={() => setSortOrder('confidenceAsc')}
                  className="w-full text-left px-4 py-3 text-sm font-medium text-app-text hover:bg-app-surface-hover transition-colors"
                >
                  Confidence Score (Low → High)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-app-bg border-b border-app-border">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-app-text-muted uppercase tracking-widest">
                Source System
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-app-text-muted uppercase tracking-widest">
                Target System
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-app-text-muted uppercase tracking-widest">
                Type
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-app-text-muted uppercase tracking-widest">
                Evidence (File:Line)
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-app-text-muted uppercase tracking-widest">
                Confidence / Notes
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-app-border">
            {paginatedData.map((item) => (
              <tr key={item.id} className="hover:bg-app-surface-hover/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        item.color === 'blue'
                          ? 'bg-amber-500'
                          : item.color === 'purple'
                          ? 'bg-purple-500'
                          : item.color === 'orange'
                          ? 'bg-orange-500'
                          : 'bg-cyan-500'
                      } shadow-sm`}
                    ></span>
                    <span className="text-sm font-bold text-app-text">{item.source}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-app-text-muted font-medium">{item.target}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${
                      item.color === 'blue'
                        ? 'bg-amber-500/10 text-amber-600'
                        : item.color === 'purple'
                        ? 'bg-purple-500/10 text-purple-600'
                        : item.color === 'orange'
                        ? 'bg-orange-500/10 text-orange-600'
                        : 'bg-cyan-500/10 text-cyan-600'
                    }`}
                  >
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
            {paginatedData.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-app-text-muted">
                  No integration records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 bg-app-bg flex justify-between items-center px-6 border-t border-app-border transition-colors">
        <p className="text-[10px] font-black text-app-text-muted uppercase tracking-widest">
          Showing {totalItems > 0 ? startIndex + 1 : 0}-{endIndex} of {totalItems} discovered integrations
        </p>

        <div className="flex items-center gap-4">
          <span className="text-xs font-bold text-app-text-muted">
            Page {currentPageAdjusted} of {displayPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={handlePrevious}
              disabled={currentPageAdjusted === 1}
              className="p-1.5 border border-app-border rounded hover:bg-app-surface-hover transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4 text-app-text-muted" />
            </button>
            <button
              onClick={handleNext}
              disabled={currentPageAdjusted >= displayPages}
              className="p-1.5 border border-app-border rounded hover:bg-app-surface-hover transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4 text-app-text-muted" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResultsTable;