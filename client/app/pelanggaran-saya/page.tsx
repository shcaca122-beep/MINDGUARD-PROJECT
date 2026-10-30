'use client';

import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';
import { AlertTriangle, CalendarDays, Loader2, RefreshCw, ShieldAlert } from 'lucide-react';
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

export default function PelanggaranSayaPage() {
  const [violations, setViolations] = useState<StudentViolation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

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

  return (
    <div className="student-panel-page" style={{ display: 'flex', minHeight: '100vh', width: '100%', background: 'linear-gradient(135deg, #021f18 0%, #032c22 45%, #064e3b 100%)', color: '#f1f5f9', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ background: '#021f18', borderRight: '1px solid rgba(52, 211, 153, 0.15)', flexShrink: 0 }}>
        <Sidebar />
      </div>
      <main style={{ flex: 1, minWidth: 0, padding: '30px', boxSizing: 'border-box' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', borderBottom: '1px solid rgba(52, 211, 153, 0.2)', paddingBottom: '18px', marginBottom: '24px' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0, color: '#fff', fontSize: '21px' }}>
              <ShieldAlert size={23} color="#fbbf24" /> Poin & Pelanggaran Saya
            </h1>
            <p style={{ margin: '6px 0 0', color: '#a7f3d0', fontSize: '13px' }}>
              Lihat jumlah poin dan rincian catatan pelanggaran yang terhubung ke akunmu.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadViolations()}
            disabled={loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', border: '1px solid #1d5a43', borderRadius: '8px', padding: '9px 12px', background: '#073b2c', color: '#a7f3d0', fontWeight: 700, cursor: loading ? 'wait' : 'pointer' }}
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            Muat ulang
          </button>
        </header>

        {loadError ? (
          <section role="alert" style={{ padding: '18px', border: '1px solid rgba(248, 113, 113, .4)', borderRadius: '12px', background: 'rgba(127, 29, 29, .2)', color: '#fecaca' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', fontWeight: 700 }}>
              <AlertTriangle size={18} /> Catatan belum dapat dimuat
            </div>
            <p style={{ margin: '9px 0 0', fontSize: '13px' }}>{loadError}</p>
          </section>
        ) : (
          <>
            <section aria-label="Ringkasan poin pelanggaran" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '14px', marginBottom: '24px' }}>
              <div style={{ padding: '20px', border: '1px solid rgba(251, 191, 36, .3)', borderRadius: '14px', background: 'rgba(2, 31, 24, .8)' }}>
                <p style={{ margin: 0, color: '#fde68a', fontSize: '12px', fontWeight: 700 }}>TOTAL POIN PELANGGARAN</p>
                <p style={{ margin: '8px 0 0', color: '#fbbf24', fontSize: '34px', fontWeight: 800 }}>{loading ? '—' : totalPoints}</p>
                <p style={{ margin: '2px 0 0', color: '#94a3b8', fontSize: '12px' }}>Akumulasi dari catatan yang tampil</p>
              </div>
              <div style={{ padding: '20px', border: '1px solid rgba(52, 211, 153, .25)', borderRadius: '14px', background: 'rgba(2, 31, 24, .8)' }}>
                <p style={{ margin: 0, color: '#a7f3d0', fontSize: '12px', fontWeight: 700 }}>JUMLAH CATATAN</p>
                <p style={{ margin: '8px 0 0', color: '#34d399', fontSize: '34px', fontWeight: 800 }}>{loading ? '—' : violations.length}</p>
                <p style={{ margin: '2px 0 0', color: '#94a3b8', fontSize: '12px' }}>Catatan pelanggaran terhubung</p>
              </div>
            </section>

            <section className="student-violation-details" style={{ overflow: 'hidden', border: '1px solid #1d3d30', borderRadius: '12px', background: '#0b2119' }}>
              <div style={{ padding: '15px 18px', borderBottom: '1px solid #193328' }}>
                <h2 style={{ margin: 0, color: '#fff', fontSize: '15px' }}>Rincian Pelanggaran</h2>
              </div>
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '9px', padding: '34px', color: '#a7f3d0', fontSize: '13px' }}>
                  <Loader2 size={18} className="animate-spin" /> Memuat catatan...
                </div>
              ) : violations.length === 0 ? (
                <div style={{ padding: '34px 18px', textAlign: 'center', color: '#a7f3d0', fontSize: '13px' }}>
                  Belum ada catatan pelanggaran yang terhubung ke akunmu.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '0' }}>
                  {violations.map((violation) => (
                    <article key={violation.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '12px', padding: '16px 18px', borderBottom: '1px solid #193328' }}>
                      <div style={{ minWidth: 0 }}>
                        <h3 style={{ margin: 0, color: '#f1f5f9', fontSize: '14px', lineHeight: 1.5 }}>
                          {violation.jenis_pelanggaran || 'Jenis pelanggaran tidak dicantumkan'}
                        </h3>
                        {violation.kategori && <p style={{ margin: '4px 0 0', color: '#6ee7b7', fontSize: '12px' }}>{violation.kategori}</p>}
                        {violation.keterangan && violation.keterangan !== violation.jenis_pelanggaran && (
                          <p style={{ margin: '7px 0 0', color: '#94a3b8', fontSize: '12px', lineHeight: 1.5 }}>{violation.keterangan}</p>
                        )}
                        <p style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '9px 0 0', color: '#94a3b8', fontSize: '11px' }}>
                          <CalendarDays size={13} />
                          {formatDate(violation.tanggal || violation.created_at)}
                        </p>
                      </div>
                      <div style={{ alignSelf: 'start', whiteSpace: 'nowrap', padding: '6px 10px', border: '1px solid rgba(251, 191, 36, .3)', borderRadius: '999px', background: 'rgba(120, 53, 15, .25)', color: '#fcd34d', fontSize: '12px', fontWeight: 800 }}>
                        +{Number.isFinite(Number(violation.poin)) ? Number(violation.poin) : 0} poin
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
            <p style={{ margin: '12px 2px 0', color: '#78998b', fontSize: '11px', lineHeight: 1.5 }}>
              Hanya catatan yang telah ditautkan ke akun siswa ini yang ditampilkan. Jika ada catatan yang menurutmu belum tercantum, silakan hubungi guru BK.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
