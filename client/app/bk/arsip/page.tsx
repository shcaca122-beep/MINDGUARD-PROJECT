'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import BKUtilityBar from '../BKUtilityBar';
import { supabase } from '@/lib/supabase';
import type { DatabaseRow } from '@/lib/database-row';
import { formatErrorMessage } from '@/lib/error-utils';
import { showError } from '@/lib/swal';
import { printParentCallLetter } from '@/lib/parent-call-letter';
import { Archive, Calendar, Home, PhoneCall, Printer, RefreshCw } from 'lucide-react';

type ArchiveKind = 'panggilan' | 'home_visit';

type ArchiveEntry = {
  id: string;
  kind: ArchiveKind;
  nama: string;
  kelas: string;
  tanggal: string;
  detail: string;
  pukul: string;
  sortDate: string;
  record: DatabaseRow;
};

type ArchiveFilter = 'semua' | ArchiveKind;

function text(value: unknown, fallback = '-'): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : fallback;
}

export default function BKArchivePage() {
  const router = useRouter();
  const [entries, setEntries] = useState<ArchiveEntry[]>([]);
  const [searchText, setSearchText] = useState('');
  const [filter, setFilter] = useState<ArchiveFilter>('semua');
  const [isLoading, setIsLoading] = useState(true);

  const fetchArchive = useCallback(async () => {
    setIsLoading(true);
    try {
      const [callsResult, visitsResult] = await Promise.all([
        supabase.from('panggilan_ortu').select('*'),
        supabase.from('home_visit').select('*'),
      ]);

      if (callsResult.error) throw new Error(`Arsip surat panggilan: ${callsResult.error.message}`);
      if (visitsResult.error) throw new Error(`Arsip home visit: ${visitsResult.error.message}`);

      const calls: ArchiveEntry[] = (callsResult.data || []).map((raw: Record<string, unknown>, index: number) => {
        const name = text(raw.nama_siswa ?? raw.nama);
        const detail = text(raw.keperluan ?? raw.alasan, 'Tidak ada catatan keperluan');
        const date = text(raw.tanggal ?? raw.created_at);
        const record = {
          ...raw,
          nama_siswa: name,
          kelas: text(raw.kelas),
          keperluan: detail,
          tanggal: date,
          pukul: text(raw.pukul, '09:00'),
        } as DatabaseRow;

        return {
          id: `panggilan-${text(raw.id, String(index))}`,
          kind: 'panggilan',
          nama: name,
          kelas: text(raw.kelas),
          tanggal: date,
          detail,
          pukul: text(raw.pukul, '09:00'),
          sortDate: text(raw.created_at ?? raw.tanggal, ''),
          record,
        };
      });

      const visits: ArchiveEntry[] = (visitsResult.data || []).map((raw: Record<string, unknown>, index: number) => ({
        id: `home-visit-${text(raw.id, String(index))}`,
        kind: 'home_visit',
        nama: text(raw.nama_siswa ?? raw.nama),
        kelas: text(raw.kelas),
        tanggal: text(raw.tanggal ?? raw.created_at),
        detail: `${text(raw.alamat, 'Alamat belum dicatat')} — ${text(raw.catatan ?? raw.alasan, 'Tidak ada catatan kunjungan')}`,
        pukul: '',
        sortDate: text(raw.created_at ?? raw.tanggal, ''),
        record: raw as DatabaseRow,
      }));

      setEntries([...calls, ...visits].sort((a, b) => b.sortDate.localeCompare(a.sortDate)));
    } catch (error: unknown) {
      console.error('Gagal memuat arsip BK:', error);
      showError('Arsip BK gagal dimuat', formatErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const session = localStorage.getItem('user_session') || localStorage.getItem('admin_session');
    if (!session) {
      router.push('/');
      return;
    }
    queueMicrotask(() => void fetchArchive());
  }, [fetchArchive, router]);

  const normalizedSearch = searchText.trim().toLowerCase();
  const filteredEntries = useMemo(() => entries.filter((entry) => {
    const matchesType = filter === 'semua' || entry.kind === filter;
    const matchesSearch = [entry.nama, entry.kelas, entry.tanggal, entry.detail]
      .some((value) => value.toLowerCase().includes(normalizedSearch));
    return matchesType && matchesSearch;
  }), [entries, filter, normalizedSearch]);

  return (
    <div className="bk-panel-page" style={{ display: 'flex', minHeight: '100vh', width: '100%', background: 'linear-gradient(135deg, #021f18 0%, #032c22 35%, #054233 70%, #064e3b 100%)', fontFamily: 'system-ui, sans-serif', boxSizing: 'border-box' }}>
      <div className="bk-panel-sidebar" style={{ background: '#021f18', borderRight: '1px solid rgba(52, 211, 153, 0.15)', flexShrink: 0 }}>
        <Sidebar />
      </div>
      <div className="bk-panel-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowY: 'auto', width: '100%', boxSizing: 'border-box' }}>
        <BKUtilityBar
          currentRoute="Arsip BK"
          searchValue={searchText}
          searchPlaceholder="Cari nama, kelas, alasan, atau tanggal..."
          onSearchChange={setSearchText}
          onRefresh={fetchArchive}
          isRefreshing={isLoading}
        />
        <div className="bk-route-heading" style={{ background: 'linear-gradient(135deg, #021f18 0%, #064e3b 100%)', color: '#ffffff', padding: '18px 30px', borderBottom: '1px solid rgba(52, 211, 153, 0.25)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ backgroundColor: 'rgba(52, 211, 153, 0.15)', padding: 8, borderRadius: 10, border: '1px solid rgba(52,211,153,0.3)' }}>
            <Archive size={24} color="#34d399" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Arsip Administrasi BK</h2>
            <span style={{ fontSize: '12px', color: '#a7f3d0' }}>Surat panggilan orang tua dan catatan home visit dalam satu arsip.</span>
          </div>
        </div>
        <div className="bk-panel-content" style={{ padding: '30px', flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <label htmlFor="archive-filter" style={{ color: '#d1fae5', fontSize: '13px', fontWeight: 700 }}>Jenis arsip</label>
              <select id="archive-filter" value={filter} onChange={(e) => setFilter(e.target.value as ArchiveFilter)} style={{ background: '#021f18', color: '#fff', border: '1px solid rgba(52,211,153,0.35)', borderRadius: '9px', padding: '9px 12px' }}>
                <option value="semua">Semua catatan</option>
                <option value="panggilan">Surat panggilan</option>
                <option value="home_visit">Home visit</option>
              </select>
            </div>
            <button type="button" onClick={() => void fetchArchive()} disabled={isLoading} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#064e3b', color: '#a7f3d0', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '9px', padding: '9px 12px', cursor: isLoading ? 'wait' : 'pointer' }}>
              <RefreshCw size={15} /> Muat ulang
            </button>
          </div>
          {filteredEntries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '42px 20px', color: '#94a3b8', background: 'rgba(2,31,24,0.6)', borderRadius: '16px', border: '1px solid rgba(52,211,153,0.2)' }}>
              {isLoading ? 'Memuat arsip...' : 'Belum ada catatan yang cocok.'}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              {filteredEntries.map((entry) => (
                <article key={entry.id} style={{ background: 'rgba(2,31,24,0.88)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: '14px', padding: '20px', color: '#e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', color: entry.kind === 'panggilan' ? '#fecaca' : '#a7f3d0', fontSize: '12px', fontWeight: 800 }}>
                      {entry.kind === 'panggilan' ? <PhoneCall size={15} /> : <Home size={15} />}
                      {entry.kind === 'panggilan' ? 'Surat panggilan orang tua' : 'Home visit'}
                    </span>
                    <span style={{ color: '#94a3b8', fontSize: '12px' }}>{entry.kelas}</span>
                  </div>
                  <h3 style={{ margin: '0 0 8px', fontSize: '16px', color: '#f8fafc' }}>{entry.nama}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: '#7dd3fc', fontSize: '12px', marginBottom: '12px' }}>
                    <Calendar size={14} /> {entry.tanggal}{entry.pukul ? ` • ${entry.pukul} WIB` : ''}
                  </div>
                  <p style={{ margin: 0, color: '#cbd5e1', fontSize: '13px', lineHeight: 1.6, overflowWrap: 'anywhere' }}>{entry.detail}</p>
                  {entry.kind === 'panggilan' && (
                    <button type="button" onClick={() => printParentCallLetter(entry.record)} style={{ marginTop: '16px', width: '100%', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: '8px', background: '#064e3b', color: '#a7f3d0', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '9px', padding: '10px', cursor: 'pointer', fontWeight: 700 }}>
                      <Printer size={15} /> Cetak surat
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
        <footer style={{ background: 'linear-gradient(135deg, #021f18 0%, #064e3b 100%)', color: '#a7f3d0', padding: '16px', textAlign: 'center', fontSize: '11.5px', borderTop: '1px solid rgba(52, 211, 153, 0.2)', width: '100%', boxSizing: 'border-box' }}>
          &copy; 2026 Panel Bimbingan Konseling MindGuard - SMK Budi Bakti Ciwidey
        </footer>
      </div>
    </div>
  );
}
