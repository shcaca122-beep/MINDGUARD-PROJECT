'use client';

import { ChevronRight, RefreshCw, Search } from 'lucide-react';

type BKUtilityBarProps = {
  currentRoute: string;
  searchValue: string;
  searchPlaceholder: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void | Promise<void>;
  isRefreshing: boolean;
};

export default function BKUtilityBar({
  currentRoute,
  searchValue,
  searchPlaceholder,
  onSearchChange,
  onRefresh,
  isRefreshing,
}: BKUtilityBarProps) {
  return (
    <div className="bk-utility-bar no-print">
      <div className="bk-utility-route" aria-label={`Lokasi saat ini: BK, ${currentRoute}`}>
        <span>BK</span>
        <ChevronRight size={14} aria-hidden="true" />
        <strong>{currentRoute}</strong>
      </div>

      <label className="bk-utility-search">
        <Search size={16} aria-hidden="true" />
        <input
          type="search"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
        />
      </label>

      <button
        className="bk-utility-refresh"
        type="button"
        onClick={() => void onRefresh()}
        disabled={isRefreshing}
      >
        <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : undefined} aria-hidden="true" />
        <span>{isRefreshing ? 'Memuat...' : 'Refresh'}</span>
      </button>
    </div>
  );
}
