"use client";

import { useState, useEffect } from "react";
import { Search, X, Clock } from "lucide-react";

interface SearchFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  aiProvider: string;
  onAiProviderChange: (provider: string) => void;
  sortOrder: string;
  onSortChange: (sort: string) => void;
  searchHistory?: string[];
  onHistorySelect?: (query: string) => void;
  onClearHistory?: () => void;
}

export default function SearchFilters({
  searchQuery,
  onSearchChange,
  aiProvider,
  onAiProviderChange,
  sortOrder,
  onSortChange,
  searchHistory = [],
  onHistorySelect,
  onClearHistory,
}: SearchFiltersProps) {
  const [showHistory, setShowHistory] = useState(false);

  const sortOptions = [
    { value: "latest", label: "최신순" },
    { value: "popular", label: "인기순" },
    { value: "rating", label: "평점순" },
  ];

  return (
    <div className="space-y-4">
      {/* Search Input with History */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setShowHistory(true)}
            onBlur={() => setTimeout(() => setShowHistory(false), 200)}
            placeholder="프롬프트 검색..."
            className="input-aurora w-full pl-12 pr-10 py-3 rounded-lg"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Search History Dropdown */}
        {showHistory && searchHistory.length > 0 && (
          <div className="absolute z-10 w-full mt-2 bg-white/80 backdrop-blur-md dark:bg-white/5 dark:backdrop-blur-md border border-primary/20 dark:border-white/20 rounded-lg shadow-lg dark:shadow-2xl max-h-60 overflow-y-auto">
            <div className="p-2 flex items-center justify-between border-b border-border/50 dark:border-white/10">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>최근 검색</span>
              </div>
              {onClearHistory && (
                <button
                  onClick={onClearHistory}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  전체 삭제
                </button>
              )}
            </div>
            <div className="p-2">
              {searchHistory.map((query, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (onHistorySelect) {
                      onHistorySelect(query);
                    }
                    setShowHistory(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded hover:bg-secondary transition-colors text-sm"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sort Options */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">정렬:</span>
        <select
          value={sortOrder}
          onChange={(e) => onSortChange(e.target.value)}
          className="input-aurora px-3 py-1.5 rounded text-sm"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

