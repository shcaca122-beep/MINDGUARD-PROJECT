'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';
import { CalendarDays, ChevronLeft, ChevronRight, RefreshCw, Search } from 'lucide-react';

type PelanggaranRecord = {
  id: string | number;
  nama_siswa: string;
  kelas: string;
  tanggal: string;
  jam_kejadian: string;
  jenis_pelanggaran: string;
  kategori?: string;
  poin: number;
  keterangan?: string;
  tindakan?: string;
  pencatat?: string;
};

const getTodayKey = () => {
  const today = new Date();
  return new Date(today.getTime() - today.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
};

const getDateKey = (date: Date) => {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
};

const getWeekBounds = (dateKey: string) => {
  const start = new Date(`${dateKey}T00:00:00`);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return { start: getDateKey(start), end: getDateKey(end) };
};

const formatDate = (dateKey: string, options: Intl.DateTimeFormatOptions) =>
  new Date(`${dateKey}T00:00:00`).toLocaleDateString('id-ID', options);

export default function RekapMingguanPage() {
  const [selectedDate, setSelectedDate] = useState(getTodayKey);
  const [weeklyRecords, setWeeklyRecords] = useState<PelanggaranRecord[]>([]);
  const [loadedRange, setLoadedRange] = useState('');
  const [loadError, setLoadError] = useState('');
  const [searchText, setSearchText] = useState('');
  const { start: weekStart, end: weekEnd } = getWeekBounds(selectedDate);
  const rangeKey = `${weekStart}:${weekEnd}`;
  const loading = loadedRange !== rangeKey;

  useEffect(() => {
    let cancelled = false;

    Promise.resolve().then(async () => {
      if (cancelled) return;
      setLoadError('');
      const { data, error } = await supabase
        .from('pelanggaran_siswa')
        .select('*')
        .gte('tanggal', weekStart)
        .lte('tanggal', weekEnd)
        .order('tanggal', { ascending: true })
        .order('jam_kejadian', { ascending: true });

      if (cancelled) return;
      if (error) {
        setWeeklyRecords([]);
        setLoadError(error.message);
      } else {
        setWeeklyRecords((data || []) as PelanggaranRecord[]);
      }
      setLoadedRange(rangeKey);
    });

    return () => {
      cancelled = true;
    };
  }, [rangeKey, weekEnd, weekStart]);

  const shiftWeek = (amount: number) => {
    const date = new Date(`${selectedDate}T00:00:00`);
    date.setDate(date.getDate() + amount * 7);
    setSelectedDate(getDateKey(date));
  };

  const weekDates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(`${weekStart}T00:00:00`);
    date.setDate(date.getDate() + index);
    return getDateKey(date);
  });

  const selectedDayRecords = weeklyRecords.filter((record) => {
    const search = searchText.trim().toLocaleLowerCase('id');
    const searchableText = [
      record.nama_siswa,
      record.kelas,
      record.jenis_pelanggaran,
      record.kategori,
      record.pencatat,
      record.keterangan,
      record.tindakan,
    ].join(' ').toLocaleLowerCase('id');

    return record.tanggal === selectedDate && searchableText.includes(search);
  });

  const totalPoints = weeklyRecords.reduce((total, record) => total + Number(record.poin || 0), 0);
  const dayRecords = weeklyRecords.filter((record) => record.tanggal === selectedDate);
  const dayPoints = dayRecords.reduce((total, record) => total + Number(record.poin || 0), 0);

  const panelStyle = {
    background: 'rgba(2, 31, 24, 0.85)',
    border: '1px solid rgba(52, 211, 153, 0.2)',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
  };

  const inputStyle = {
    width: '100%',
    minHeight: '42px',
    padding: '9px 11px',
    border: '1px solid rgba(52, 211, 153, 0.3)',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.06)',
    color: '#ecfdf5',
    fontSize: '13px',
    boxSizing: 'border-box' as const,
    colorScheme: 'dark' as const,
  };

  return (
    <>
      <style>{`
        body:has(.weekly-report-page), html:has(.weekly-report-page) {
          background: #021f18 !important;
          overflow-x: hidden;
        }
        .weekly-report-page button { transition: border-color 160ms ease, background-color 160ms ease, transform 160ms ease; }
        .weekly-report-page button:hover { border-color: #34d399 !important; }
        .weekly-report-page .week-day:hover { transform: translateY(-2px); }
        @media (max-width: 900px) {
          .weekly-report-toolbar { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          .weekly-report-days { grid-template-columns: repeat(4, minmax(120px, 1fr)) !important; }
        }
        @media (max-width: 600px) {
          .weekly-report-header { align-items: flex-start !important; flex-direction: column; padding: 18px 16px !important; }
          .weekly-report-content { padding: 16px !important; }
          .weekly-report-toolbar { grid-template-columns: minmax(0, 1fr) !important; padding: 14px !important; }
          .weekly-report-days { grid-template-columns: repeat(7, minmax(118px, 1fr)) !important; overflow-x: auto; }
          .weekly-report-stat { padding: 10px 2px !important; border-left: 0 !important; border-top: 1px solid rgba(52, 211, 153, 0.15); }
          .weekly-report-day-heading { align-items: stretch !important; flex-direction: column; padding: 14px !important; }
          .weekly-report-search { width: 100% !important; }
        }
      `}</style>
      <div className="weekly-report-page" style={{ display: 'flex', minHeight: '100vh', width: '100%', background: 'linear-gradient(135deg, #021f18 0%, #032c22 35%, #054233 70%, #064e3b 100%)', color: '#ecfdf5', fontFamily: 'system-ui, -apple-system, sans-serif', boxSizing: 'border-box' }}>
        <div style={{ background: '#021f18', borderRight: '1px solid rgba(52, 211, 153, 0.15)', flexShrink: 0 }}>
          <Sidebar />
        </div>
        <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <header className="weekly-report-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', padding: '16px 30px', background: 'linear-gradient(135deg, #021f18 0%, #064e3b 100%)', borderBottom: '1px solid rgba(52, 211, 153, 0.2)', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)' }}>
            <div>
              <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0, fontSize: '20px', color: '#ffffff' }}>
                <CalendarDays size={21} color="#34d399" /> Rekap Mingguan OSIS & MPK
              </h1>
              <p style={{ margin: '6px 0 0', color: '#a7f3d0', fontSize: '13px' }}>Catatan pelanggaran gerbang per hari untuk OSIS, MPK, dan Guru BK.</p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedDate(getTodayKey())}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', minHeight: '40px', padding: '9px 14px', border: '1px solid rgba(52, 211, 153, 0.3)', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.08)', color: '#ffffff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              <RefreshCw size={14} color="#34d399" /> Minggu ini
            </button>
          </header>

          <div className="weekly-report-content" style={{ display: 'grid', flex: 1, alignContent: 'start', gap: '20px', padding: '26px 30px', maxWidth: '1460px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
            <section className="weekly-report-toolbar" style={{ ...panelStyle, display: 'grid', gridTemplateColumns: 'minmax(190px, 1.2fr) minmax(230px, 1.3fr) repeat(2, minmax(145px, 0.75fr))', alignItems: 'end', gap: '18px', padding: '18px 20px' }}>
              <label style={{ display: 'grid', gap: '7px', color: '#a7f3d0', fontSize: '12px', fontWeight: 700 }}>
                Pilih tanggal
                <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} style={inputStyle} />
              </label>
              <div style={{ display: 'grid', gap: '7px' }}>
                <span style={{ color: '#a7f3d0', fontSize: '12px', fontWeight: 700 }}>Periode minggu</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minHeight: '42px' }}>
                  <button type="button" aria-label="Minggu sebelumnya" onClick={() => shiftWeek(-1)} style={{ ...inputStyle, width: '42px', flexShrink: 0, display: 'grid', placeItems: 'center', padding: 0, cursor: 'pointer' }}>
                    <ChevronLeft size={17} color="#34d399" />
                  </button>
                  <strong style={{ flex: 1, textAlign: 'center', fontSize: '13px', lineHeight: 1.5 }}>
                    {formatDate(weekStart, { day: 'numeric', month: 'short' })} – {formatDate(weekEnd, { day: 'numeric', month: 'long', year: 'numeric' })}
                  </strong>
                  <button type="button" aria-label="Minggu berikutnya" onClick={() => shiftWeek(1)} style={{ ...inputStyle, width: '42px', flexShrink: 0, display: 'grid', placeItems: 'center', padding: 0, cursor: 'pointer' }}>
                    <ChevronRight size={17} color="#34d399" />
                  </button>
                </div>
              </div>
              <div className="weekly-report-stat" style={{ padding: '8px 14px', borderLeft: '1px solid rgba(52, 211, 153, 0.15)' }}>
                <div style={{ color: '#a7f3d0', fontSize: '12px' }}>Total kasus minggu ini</div>
                <strong style={{ display: 'block', marginTop: '5px', color: '#ffffff', fontSize: '23px' }}>{loading ? '…' : weeklyRecords.length}</strong>
              </div>
              <div className="weekly-report-stat" style={{ padding: '8px 14px', borderLeft: '1px solid rgba(52, 211, 153, 0.15)' }}>
                <div style={{ color: '#a7f3d0', fontSize: '12px' }}>Total poin minggu ini</div>
                <strong style={{ display: 'block', marginTop: '5px', color: '#ffffff', fontSize: '23px' }}>{loading ? '…' : totalPoints}</strong>
              </div>
            </section>

            <section className="weekly-report-days" aria-label="Ringkasan pelanggaran per hari" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '10px', paddingBottom: '2px' }}>
              {weekDates.map((dateKey) => {
                const records = weeklyRecords.filter((record) => record.tanggal === dateKey);
                const points = records.reduce((total, record) => total + Number(record.poin || 0), 0);
                const active = selectedDate === dateKey;

                return (
                  <button
                    className="week-day"
                    key={dateKey}
                    type="button"
                    onClick={() => setSelectedDate(dateKey)}
                    aria-pressed={active}
                    style={{ minWidth: 0, minHeight: '104px', padding: '13px', textAlign: 'left', border: active ? '2px solid #34d399' : '1px solid rgba(52, 211, 153, 0.2)', borderRadius: '10px', background: active ? 'rgba(52, 211, 153, 0.16)' : 'rgba(2, 31, 24, 0.72)', color: '#ecfdf5', cursor: 'pointer', boxShadow: active ? '0 0 18px rgba(52, 211, 153, 0.12)' : 'none' }}
                  >
                    <span style={{ display: 'block', color: '#a7f3d0', fontSize: '11px', textTransform: 'capitalize' }}>{formatDate(dateKey, { weekday: 'long' })}</span>
                    <strong style={{ display: 'block', marginTop: '5px', color: '#ffffff', fontSize: '18px' }}>{formatDate(dateKey, { day: 'numeric', month: 'short' })}</strong>
                    <span style={{ display: 'block', marginTop: '8px', color: '#a7f3d0', fontSize: '11px' }}>{loading ? 'Memuat…' : `${records.length} kasus · ${points} poin`}</span>
                  </button>
                );
              })}
            </section>

            <section style={{ ...panelStyle, overflow: 'hidden' }}>
              <div className="weekly-report-day-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '18px', flexWrap: 'wrap', padding: '18px 20px', borderBottom: '1px solid rgba(52, 211, 153, 0.15)' }}>
                <div>
                  <h2 style={{ margin: 0, color: '#ffffff', fontSize: '16px', textTransform: 'capitalize' }}>{formatDate(selectedDate, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h2>
                  <p style={{ margin: '5px 0 0', color: '#a7f3d0', fontSize: '12px' }}>{dayRecords.length} kasus · {dayPoints} poin tercatat</p>
                </div>
                <label className="weekly-report-search" style={{ position: 'relative', width: 'min(100%, 380px)' }}>
                  <Search size={16} color="#a7f3d0" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                  <input type="search" value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Cari nama, kelas, pelanggaran, petugas..." aria-label="Cari catatan pada tanggal terpilih" style={{ ...inputStyle, paddingLeft: '38px' }} />
                </label>
              </div>

              {loadError ? (
                <p role="alert" style={{ margin: 0, padding: '28px 16px', color: '#fca5a5', textAlign: 'center' }}>Gagal memuat rekap: {loadError}</p>
              ) : loading ? (
                <p style={{ margin: 0, padding: '28px 16px', color: '#a7f3d0', textAlign: 'center' }}>Memuat rekap mingguan...</p>
              ) : selectedDayRecords.length === 0 ? (
                <p style={{ margin: 0, padding: '34px 16px', color: '#a7f3d0', textAlign: 'center' }}>
                  {dayRecords.length ? 'Tidak ada catatan yang cocok dengan pencarian.' : 'Belum ada pelanggaran yang tercatat pada hari ini.'}
                </p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '760px', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: 'rgba(52, 211, 153, 0.08)', color: '#a7f3d0', textAlign: 'left' }}>
                        {['Waktu', 'Siswa / Kelas', 'Jenis pelanggaran', 'Poin', 'Petugas', 'Keterangan'].map((heading) => (
                          <th key={heading} scope="col" style={{ padding: '12px 15px', fontWeight: 700 }}>{heading}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDayRecords.map((record) => (
                        <tr key={record.id} style={{ borderTop: '1px solid rgba(52, 211, 153, 0.12)', color: '#d1fae5' }}>
                          <td style={{ padding: '13px 15px', whiteSpace: 'nowrap' }}>{record.jam_kejadian || '-'}</td>
                          <td style={{ padding: '13px 15px' }}><strong style={{ color: '#ffffff' }}>{record.nama_siswa || '-'}</strong><span style={{ display: 'block', marginTop: '3px', color: '#a7f3d0' }}>{record.kelas || '-'}</span></td>
                          <td style={{ padding: '13px 15px' }}>{record.jenis_pelanggaran || '-'}</td>
                          <td style={{ padding: '13px 15px', whiteSpace: 'nowrap', color: '#34d399', fontWeight: 700 }}>{Number(record.poin || 0)} poin</td>
                          <td style={{ padding: '13px 15px' }}>{record.pencatat || 'OSIS/Piket'}</td>
                          <td style={{ padding: '13px 15px', minWidth: '170px' }}>{record.keterangan || record.tindakan || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
          <footer style={{ background: 'linear-gradient(135deg, #021f18 0%, #064e3b 100%)', color: '#a7f3d0', padding: '16px', textAlign: 'center', fontSize: '11.5px', borderTop: '1px solid rgba(52, 211, 153, 0.2)', width: '100%', boxSizing: 'border-box' }}>
            © 2026 Panel OSIS & MPK MindGuard - SMK Budi Bakti Ciwidey
          </footer>
        </main>
      </div>
    </>
  );
}
