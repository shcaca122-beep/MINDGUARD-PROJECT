'use client';

import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

type StudentViolation = {
  id: string | number;
  created_at: string | null;
  tanggal: string | null;
  nama_siswa?: string | null;
  jenis_pelanggaran: string | null;
  kategori: string | null;
  poin: number | string | null;
  keterangan: string | null;
};

const formatDate = (dateValue: string | null) => {
  if (!dateValue) return 'Tanggal tidak tersedia';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

const getPointStatus = (points: number) => {
  if (points >= 75) return { label: 'SP3', description: 'Perlu tindak lanjut bersama Guru BK', tone: 'critical' };
  if (points >= 50) return { label: 'SP2', description: 'Mendekati batas pembinaan lanjutan', tone: 'warning' };
  if (points >= 25) return { label: 'SP1', description: 'Sudah melewati batas aman', tone: 'caution' };
  return { label: 'Aman', description: 'Di bawah batas SP1', tone: 'safe' };
};

export default function PelanggaranSayaPage() {
  const [violations, setViolations] = useState<StudentViolation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [studentName, setStudentName] = useState('Siswa');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedViolation, setExpandedViolation] = useState<string | number | null>(null);
  const [isSimulationOpen, setIsSimulationOpen] = useState(false);
  const [simulatedAddedPoints, setSimulatedAddedPoints] = useState(0);

  const loadViolations = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Sesi login tidak valid. Silakan masuk kembali.');

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role, student_record_id')
        .eq('user_id', user.id)
        .single();
      if (profileError) throw new Error(`Gagal memuat profil siswa: ${profileError.message}`);
      if (profile.role !== 'siswa' || !profile.student_record_id) {
        throw new Error('Profil akun belum terhubung ke data siswa. Hubungi administrator sekolah.');
      }
      const studentRecordId = String(profile.student_record_id);

      const records: StudentViolation[] = [];
      for (let offset = 0; ; offset += 500) {
        const { data, error } = await supabase
          .from('pelanggaran_siswa')
          .select('id,created_at,tanggal,jenis_pelanggaran,kategori,poin,keterangan')
          .eq('siswa_id', studentRecordId)
          .order('created_at', { ascending: false })
          .range(offset, offset + 499);
        if (error) throw new Error(`Gagal memuat catatan pelanggaran: ${error.message}`);
        records.push(...((data || []) as StudentViolation[]));
        if (!data || data.length < 500) break;
      }

      const legacyResult = await supabase
        .from('pelanggaran')
        .select('id,created_at,tanggal,nama_siswa,jenis_pelanggaran,poin')
        .eq('student_record_id', studentRecordId)
        .order('created_at', { ascending: false });
      if (legacyResult.error) {
        throw new Error(`Gagal memuat catatan pelanggaran dari panel admin: ${legacyResult.error.message}`);
      }

      const legacyRecords = ((legacyResult.data || []) as StudentViolation[]).map((record) => ({
        ...record,
        id: `admin-${record.id}`,
        keterangan: null,
      }));
      setViolations(
        [...records, ...legacyRecords].sort((first, second) =>
          new Date(second.created_at || second.tanggal || 0).getTime() -
          new Date(first.created_at || first.tanggal || 0).getTime()
        ),
      );
    } catch (error) {
      console.error('Gagal memuat catatan pelanggaran siswa:', error);
      setLoadError(error instanceof Error ? error.message : 'Catatan pelanggaran gagal dimuat.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    Promise.resolve().then(async () => {
      if (cancelled) return;
      try {
        const sessionValue = localStorage.getItem('user_session');
        if (sessionValue) {
          const session: unknown = JSON.parse(sessionValue);
          if (session && typeof session === 'object' && 'nama' in session && typeof session.nama === 'string') {
            setStudentName(session.nama);
          }
        }
      } catch (error) {
        console.error('Gagal membaca nama siswa dari sesi:', error);
      }
      await loadViolations();
      if (cancelled) return;
      channel = supabase
        .channel('student-violations-live')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'pelanggaran_siswa' }, () => {
          void loadViolations();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'pelanggaran' }, () => {
          void loadViolations();
        })
        .subscribe((status, error) => {
          if (error) {
            console.error('Realtime catatan pelanggaran tidak tersedia:', error.message);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error(`Realtime catatan pelanggaran gagal: ${status}`);
          }
        });
    });
    return () => {
      cancelled = true;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [loadViolations]);

  const totalPoints = violations.reduce((total, violation) => {
    const points = Number(violation.poin);
    return total + (Number.isFinite(points) ? points : 0);
  }, 0);
  const pointStatus = getPointStatus(totalPoints);
  const progressPercent = Math.min(100, Math.max(0, totalPoints));
  const simulatedTotalPoints = totalPoints + simulatedAddedPoints;
  const simulatedStatus = getPointStatus(simulatedTotalPoints);
  const categories = Array.from(new Set(
    violations.map((violation) => violation.kategori?.trim()).filter((category): category is string => Boolean(category)),
  ));
  const normalizedSearch = searchQuery.trim().toLocaleLowerCase('id-ID');
  const filteredViolations = violations.filter((violation) =>
    [
      violation.jenis_pelanggaran,
      violation.kategori,
      violation.keterangan,
      violation.tanggal,
      violation.created_at,
    ].some((value) => value?.toLocaleLowerCase('id-ID').includes(normalizedSearch)),
  );

  useEffect(() => {
    if (!isSimulationOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsSimulationOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSimulationOpen]);

  return (
    <div className="student-panel-page student-feature-refresh student-violations-page" style={{ display: 'flex', minHeight: '100vh', width: '100%', background: 'linear-gradient(135deg, #021f18 0%, #032c22 45%, #064e3b 100%)', color: '#f1f5f9', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ background: '#021f18', borderRight: '1px solid rgba(52, 211, 153, 0.15)', flexShrink: 0 }}>
        <Sidebar />
      </div>
      <div className="student-violations-shell">
        <header className="student-violations-topbar">
          <div className="student-violations-topbar-title">
            <div className="student-violations-breadcrumb">Ruang siswa <span>/</span> Poin &amp; Pelanggaran</div>
            <h1><ShieldAlert size={21} /> Poin &amp; Pelanggaran Saya</h1>
            <p><Sparkles size={14} /> Hai, {studentName}. Pantau progresmu dan tetap semangat, ya.</p>
          </div>
          <div className="student-violations-actions">
            <button
              type="button"
              className="student-violations-button student-violations-button-secondary"
              onClick={() => {
                setSimulatedAddedPoints(0);
                setIsSimulationOpen(true);
              }}
              disabled={loading || Boolean(loadError)}
            >
              <SlidersHorizontal size={16} /> Simulasi Ambang Poin
            </button>
            <button
              type="button"
              className="student-violations-button student-violations-button-refresh"
              onClick={() => void loadViolations()}
              disabled={loading}
              aria-label="Muat ulang catatan pelanggaran"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              <span>Muat ulang</span>
            </button>
          </div>
        </header>

        <main className="student-feature-scroll student-feature-content student-violations-content">
          {loadError ? (
            <section role="alert" className="student-violations-error">
              <div><AlertTriangle size={18} /> Catatan belum dapat dimuat</div>
              <p>{loadError}</p>
            </section>
          ) : (
            <>
              <section aria-label="Ringkasan poin pelanggaran" className="student-violations-summary">
                <article className="student-violations-card student-violations-points-card">
                  <div className="student-violations-card-heading">
                    <div>
                      <p className="student-violations-eyebrow">TOTAL POIN PELANGGARAN</p>
                      <p className="student-violations-total">{loading ? '—' : totalPoints}<span> / 100</span></p>
                    </div>
                    <div className="student-violations-card-icon"><ShieldAlert size={22} /></div>
                  </div>
                  <p className="student-violations-caption">Akumulasi dari catatan yang terhubung ke akunmu.</p>
                  <div className="student-violations-meter" role="progressbar" aria-label="Progres poin pelanggaran" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent}>
                    <div className="student-violations-meter-fill" style={{ width: `${progressPercent}%` }} />
                    {[25, 50, 75, 100].map((threshold) => (
                      <span key={threshold} className="student-violations-meter-mark" style={{ left: `${threshold}%` }} />
                    ))}
                  </div>
                  <div className="student-violations-meter-labels">
                    {[25, 50, 75, 100].map((threshold) => <span key={threshold}>{threshold}</span>)}
                  </div>
                  <div className="student-violations-meter-legend">
                    <span><i className="student-violations-dot student-violations-dot-safe" />Aman</span>
                    <span><i className="student-violations-dot student-violations-dot-caution" />SP1</span>
                    <span><i className="student-violations-dot student-violations-dot-warning" />SP2</span>
                    <span><i className="student-violations-dot student-violations-dot-critical" />SP3</span>
                  </div>
                </article>

                <article className="student-violations-card student-violations-count-card">
                  <div className="student-violations-card-heading">
                    <div>
                      <p className="student-violations-eyebrow">JUMLAH CATATAN</p>
                      <p className="student-violations-total student-violations-count">{loading ? '—' : violations.length}</p>
                    </div>
                    <div className="student-violations-card-icon student-violations-card-icon-green"><CalendarDays size={22} /></div>
                  </div>
                  <p className="student-violations-caption">Catatan pelanggaran terhubung ke akunmu.</p>
                  <div className="student-violations-categories">
                    <span className="student-violations-category-label">Kategori tercatat</span>
                    {loading ? <span className="student-violations-category">Memuat...</span> : categories.length ? (
                      <div className="student-violations-category-list">
                        {categories.map((category) => <span className="student-violations-category" key={category}>{category}</span>)}
                      </div>
                    ) : <span className="student-violations-category-empty">Belum ada kategori</span>}
                  </div>
                </article>
              </section>

              <section className={`student-violations-status student-violations-status-${pointStatus.tone}`} aria-label="Status pembinaan">
                <div className="student-violations-status-icon"><ShieldAlert size={21} /></div>
                <div className="student-violations-status-copy">
                  <span className="student-violations-eyebrow">STATUS PEMBINAAN</span>
                  <h2>{loading ? 'Memuat status...' : pointStatus.label}</h2>
                  <p>{loading ? 'Menghitung berdasarkan catatanmu.' : pointStatus.description}</p>
                </div>
                <Link href="/booking" className="student-violations-consult-link">
                  Konsultasi dengan Guru BK <ArrowRight size={16} />
                </Link>
              </section>

              <section className="student-violation-details student-violations-list-card">
                <div className="student-violations-list-heading">
                  <div>
                    <h2>Rincian Pelanggaran</h2>
                    <p>Ketuk catatan untuk melihat keterangan lebih lengkap.</p>
                  </div>
                  <label className="student-violations-search">
                    <Search size={17} aria-hidden="true" />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Cari catatan..."
                      aria-label="Cari rincian pelanggaran"
                    />
                    {searchQuery && (
                      <button type="button" onClick={() => setSearchQuery('')} aria-label="Hapus pencarian">
                        <X size={15} />
                      </button>
                    )}
                  </label>
                </div>
                {loading ? (
                  <div className="student-violations-empty-state">
                    <Loader2 size={19} className="animate-spin" /> Memuat catatan...
                  </div>
                ) : violations.length === 0 ? (
                  <div className="student-violations-empty-state">
                    <div className="student-violations-empty-icon"><Check size={20} /></div>
                    <strong>Belum ada catatan pelanggaran</strong>
                    <span>Catatan yang terhubung ke akunmu akan muncul di sini.</span>
                  </div>
                ) : filteredViolations.length === 0 ? (
                  <div className="student-violations-empty-state">
                    <Search size={19} />
                    Tidak ada catatan yang cocok dengan “{searchQuery}”.
                  </div>
                ) : (
                  <div className="student-violations-list">
                    {filteredViolations.map((violation, index) => {
                      const isExpanded = expandedViolation === violation.id;
                      const points = Number(violation.poin);
                      const detailId = `student-violation-detail-${index}`;
                      return (
                        <article key={violation.id} className={`student-violation-item${isExpanded ? ' is-expanded' : ''}`}>
                          <button
                            type="button"
                            className="student-violation-toggle"
                            aria-expanded={isExpanded}
                            aria-controls={detailId}
                            onClick={() => setExpandedViolation(isExpanded ? null : violation.id)}
                          >
                            <span className="student-violation-main">
                              <span className="student-violation-title">{violation.jenis_pelanggaran || 'Jenis pelanggaran tidak dicantumkan'}</span>
                              <span className="student-violation-meta">
                                {violation.kategori && <span className="student-violation-category">{violation.kategori}</span>}
                                <span><CalendarDays size={13} />{formatDate(violation.tanggal || violation.created_at)}</span>
                              </span>
                            </span>
                            <span className="student-violation-item-actions">
                              <span className="student-violation-points">+{Number.isFinite(points) ? points : 0} poin</span>
                              <ChevronDown size={18} className="student-violation-chevron" />
                            </span>
                          </button>
                          {isExpanded && (
                            <div id={detailId} className="student-violation-expanded" role="region">
                              <span>Keterangan</span>
                              <p>
                                {violation.keterangan && violation.keterangan !== violation.jenis_pelanggaran
                                  ? violation.keterangan
                                  : 'Tidak ada keterangan tambahan pada catatan ini.'}
                              </p>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
              <p className="student-violations-note">
                Hanya catatan yang telah ditautkan ke akun siswa ini yang ditampilkan. Jika ada catatan yang menurutmu belum tercantum, silakan hubungi guru BK.
              </p>
            </>
          )}
        </main>
      </div>

      {isSimulationOpen && (
        <div
          className="student-violations-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsSimulationOpen(false);
          }}
        >
          <section className="student-violations-modal" role="dialog" aria-modal="true" aria-labelledby="student-violations-modal-title">
            <button type="button" className="student-violations-modal-close" onClick={() => setIsSimulationOpen(false)} aria-label="Tutup simulasi">
              <X size={19} />
            </button>
            <div className="student-violations-modal-icon"><SlidersHorizontal size={21} /></div>
            <span className="student-violations-eyebrow">SIMULASI PRIBADI</span>
            <h2 id="student-violations-modal-title">Simulasi Ambang Poin</h2>
            <p className="student-violations-modal-intro">Coba lihat perubahan status jika ada tambahan poin. Simulasi ini hanya untuk gambaran dan tidak mengubah catatan resmi.</p>
            <div className="student-violations-simulation-values">
              <div><span>Poin saat ini</span><strong>{totalPoints}</strong></div>
              <ArrowRight size={18} />
              <div><span>Hasil simulasi</span><strong>{simulatedTotalPoints}</strong></div>
            </div>
            <label className="student-violations-range-label" htmlFor="student-violations-simulation-range">
              Tambahan poin simulasi <strong>+{simulatedAddedPoints}</strong>
            </label>
            <input
              id="student-violations-simulation-range"
              className="student-violations-range"
              type="range"
              min="0"
              max="100"
              step="1"
              value={simulatedAddedPoints}
              onChange={(event) => setSimulatedAddedPoints(Number(event.target.value))}
            />
            <div className={`student-violations-simulation-result student-violations-status-${simulatedStatus.tone}`}>
              <span>Status perkiraan</span>
              <strong>{simulatedStatus.label}</strong>
              <p>{simulatedStatus.description}</p>
            </div>
            <div className="student-violations-modal-footnote">
              Ambang pada skala ini: SP1 25 poin, SP2 50 poin, SP3 75 poin.
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
