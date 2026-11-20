'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  fetchDashboardAgregat,
  AgregatItem,
  UserRole,
} from '@/lib/agregatService';

interface DashboardAgregatPanelProps {
  role: UserRole;
  userId?: string;
  judul?: string;
}

export function DashboardAgregatPanel({
  role,
  userId,
  judul = 'Ringkasan Statistik Layanan',
}: DashboardAgregatPanelProps) {
  const [items, setItems] = useState<AgregatItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    const res = await fetchDashboardAgregat(role, userId);
    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setItems(res.data);
    }
    setLoading(false);
  }, [role, userId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  return (
    <section className="w-full rounded-2xl border border-[#52B788]/30 bg-[#0F291D] p-4 sm:p-6 text-[#D1FAE5] shadow-lg">
      {/* Header Dinamis */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
            {judul}
          </h2>
          <p className="text-xs text-[#D1FAE5]/70">
            Data agregat real-time khusus peran{' '}
            <span className="font-semibold uppercase text-[#52B788]">
              {role}
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadData()}
          disabled={loading}
          className="self-start sm:self-auto rounded-lg border border-[#52B788]/40 bg-[#081810] px-3 py-1.5 text-xs font-medium text-[#52B788] transition hover:bg-[#52B788]/20 disabled:opacity-50"
        >
          {loading ? 'Memuat...' : 'Segarkan Data'}
        </button>
      </div>

      {/* State Error */}
      {errorMsg && (
        <div className="rounded-xl border border-amber-400/40 bg-amber-950/50 p-3 text-xs sm:text-sm text-amber-200">
          {errorMsg}
        </div>
      )}

      {/* Grid Bento Responsif: 1 kolom di HP, 3 kolom di Tablet/Desktop */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
        {loading
          ? Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="h-24 animate-pulse rounded-xl border border-[#52B788]/20 bg-[#081810]/70 p-4"
              />
            ))
          : items.map((item, idx) => (
              <div
                key={idx}
                className={`rounded-xl border p-4 transition ${
                  item.sorotan
                    ? 'border-amber-400/60 bg-amber-950/30'
                    : 'border-[#52B788]/25 bg-[#081810]/80 hover:border-[#52B788]/60'
                }`}
              >
                <p className="text-xs font-medium text-[#D1FAE5]/75">
                  {item.label}
                </p>
                <p
                  className={`mt-1 font-mono text-2xl sm:text-3xl font-bold ${
                    item.sorotan ? 'text-amber-300' : 'text-[#52B788]'
                  }`}
                >
                  {item.nilai}
                </p>
                <p className="mt-1 text-[11px] text-[#D1FAE5]/60">
                  {item.keterangan}
                </p>
              </div>
            ))}
      </div>
    </section>
  );
}

/**
 * Komponen Banner Peringatan Ramah Saat Terjadi Duplikasi Input
 */
export function DuplicateWarningBanner({
  message,
  onClose,
}: {
  message: string | null;
  onClose?: () => void;
}) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="my-3 flex items-start justify-between gap-3 rounded-xl border border-amber-400/50 bg-amber-950/70 p-3.5 text-sm text-amber-100 shadow-sm"
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 text-base" aria-hidden="true">
          ⚠️
        </span>
        <div>
          <p className="font-semibold text-amber-300">
            Data Sudah Tercatat (Duplikasi Dicegah)
          </p>
          <p className="mt-0.5 text-xs sm:text-sm leading-relaxed text-amber-100/90">
            {message}
          </p>
        </div>
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup peringatan"
          className="rounded-lg px-2 py-1 text-xs font-semibold text-amber-300 hover:bg-amber-900/50"
        >
          ✕
        </button>
      )}
    </div>
  );
}