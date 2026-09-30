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
    background: '#ffffff',
    border: '1px solid #dce7df',
    borderRadius: '8px',
  };

  const inputStyle = {
    width: '100%',
    minHeight: '40px',
    padding: '8px 10px',
    border: '1px solid #c8d8cc',
    borderRadius: '6px',
    background: '#ffffff',
    color: '#173b2b',
    fontSize: '13px',
    boxSizing: 'border-box' as const,
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f3f7f4', color: '#173b2b', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Sidebar />
      <main style={{ flex: 1, minWidth: 0 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', padding: '20px 28px', background: '#ffffff', borderBottom: '1px solid #dce7df' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '9px', margin: 0, fontSize: '20px', color: '#173b2b' }}>
              <CalendarDays size={21} /> Rekap Mingguan OSIS & MPK
            </h1>
            <p style={{ margin: '5px 0 0', color: '#5b7565', fontSize: '13px' }}>Catatan pelanggaran gerbang per hari untuk OSIS, MPK, dan Guru BK.</p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedDate(getTodayKey())}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '7px', minHeight: '38px', padding: '8px 12px', border: '1px solid #bdd4c4', borderRadius: '6px', background: '#f7faf8', color: '#24583d', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
          >
            <RefreshCw size={14} /> Minggu ini
          </button>
        </header>

        <div style={{ display: 'grid', gap: '18px', padding: '24px 28px', maxWidth: '1500px', margin: '0 auto' }}>
          <section style={{ ...panelStyle, display: 'grid', gridTemplateColumns: 'minmax(210px, 1.2fr) minmax(210px, 1fr) minmax(150px, 0.7fr) minmax(150px, 0.7fr)', alignItems: 'end', gap: '16px', padding: '16px' }}>
            <label style={{ display: 'grid', gap: '6px', color: '#345b43', fontSize: '12px', fontWeight: 700 }}>
              Cari minggu berdasarkan tanggal
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                style={inputStyle}
              />
            </label>
            <div style={{ display: 'grid', gap: '6px' }}>
              <span style={{ color: '#688170', fontSize: '12px', fontWeight: 700 }}>Periode minggu</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minHeight: '40px' }}>
                <button type="button" aria-label="Minggu sebelumnya" onClick={() => shiftWeek(-1)} style={{ ...inputStyle, width: '40px', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
                  <ChevronLeft size={17} />
                </button>
                <strong style={{ flex: 1, textAlign: 'center', fontSize: '13px' }}>
                  {formatDate(weekStart, { day: 'numeric', month: 'short' })} – {formatDate(weekEnd, { day: 'numeric', month: 'long', year: 'numeric' })}
                </strong>
                <button type="button" aria-label="Minggu berikutnya" onClick={() => shiftWeek(1)} style={{ ...inputStyle, width: '40px', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
            <div style={{ padding: '8px 12px', borderLeft: '1px solid #e0e9e2' }}>
              <div style={{ color: '#688170', fontSize: '12px' }}>Total kasus minggu ini</div>
              <strong style={{ display: 'block', marginTop: '4px', fontSize: '22px' }}>{loading ? '…' : weeklyRecords.length}</strong>
            </div>
            <div style={{ padding: '8px 12px', borderLeft: '1px solid #e0e9e2' }}>
              <div style={{ color: '#688170', fontSize: '12px' }}>Total poin minggu ini</div>
              <strong style={{ display: 'block', marginTop: '4px', fontSize: '22px' }}>{loading ? '…' : totalPoints}</strong>
            </div>
          </section>

          <section aria-label="Ringkasan pelanggaran per hari" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(110px, 1fr))', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
            {weekDates.map((dateKey) => {
              const records = weeklyRecords.filter((record) => record.tanggal === dateKey);
              const points = records.reduce((total, record) => total + Number(record.poin || 0), 0);
              const active = selectedDate === dateKey;

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => setSelectedDate(dateKey)}
                  aria-pressed={active}
                  style={{ minWidth: '110px', minHeight: '98px', padding: '12px', textAlign: 'left', border: active ? '2px solid #28734b' : '1px solid #d4e2d7', borderRadius: '8px', background: active ? '#e5f2e8' : '#ffffff', color: '#173b2b', cursor: 'pointer' }}
                >
                  <span style={{ display: 'block', color: '#567361', fontSize: '11px', textTransform: 'capitalize' }}>{formatDate(dateKey, { weekday: 'long' })}</span>
                  <strong style={{ display: 'block', marginTop: '4px', fontSize: '17px' }}>{formatDate(dateKey, { day: 'numeric', month: 'short' })}</strong>
                  <span style={{ display: 'block', marginTop: '7px', color: '#42634d', fontSize: '11px' }}>{loading ? 'Memuat…' : `${records.length} kasus · ${points} poin`}</span>
                </button>
              );
            })}
          </section>

          <section style={{ ...panelStyle, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', padding: '16px', borderBottom: '1px solid #e1e9e3' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '16px', textTransform: 'capitalize' }}>{formatDate(selectedDate, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h2>
                <p style={{ margin: '4px 0 0', color: '#688170', fontSize: '12px' }}>{dayRecords.length} kasus · {dayPoints} poin tercatat</p>
              </div>
              <label style={{ position: 'relative', width: 'min(100%, 360px)' }}>
                <Search size={16} color="#688170" style={{ position: 'absolute', left: '11px', top: '12px' }} />
                <input
                  type="search"
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Cari nama, kelas, pelanggaran, petugas..."
                  aria-label="Cari catatan pada tanggal terpilih"
                  style={{ ...inputStyle, paddingLeft: '36px' }}
                />
              </label>
            </div>

            {loadError ? (
              <p role="alert" style={{ margin: 0, padding: '28px 16px', color: '#a63131', textAlign: 'center' }}>Gagal memuat rekap: {loadError}</p>
            ) : loading ? (
              <p style={{ margin: 0, padding: '28px 16px', color: '#688170', textAlign: 'center' }}>Memuat rekap mingguan...</p>
            ) : selectedDayRecords.length === 0 ? (
              <p style={{ margin: 0, padding: '32px 16px', color: '#688170', textAlign: 'center' }}>
                {dayRecords.length ? 'Tidak ada catatan yang cocok dengan pencarian.' : 'Belum ada pelanggaran yang tercatat pada hari ini.'}
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '760px', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#f4f8f5', color: '#567361', textAlign: 'left' }}>
                      {['Waktu', 'Siswa / Kelas', 'Jenis pelanggaran', 'Poin', 'Petugas', 'Keterangan'].map((heading) => (
                        <th key={heading} scope="col" style={{ padding: '11px 14px', fontWeight: 700 }}>{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDayRecords.map((record) => (
                      <tr key={record.id} style={{ borderTop: '1px solid #e7eee8', color: '#294936' }}>
                        <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>{record.jam_kejadian || '-'}</td>
                        <td style={{ padding: '12px 14px' }}><strong>{record.nama_siswa || '-'}</strong><span style={{ display: 'block', marginTop: '3px', color: '#688170' }}>{record.kelas || '-'}</span></td>
                        <td style={{ padding: '12px 14px' }}>{record.jenis_pelanggaran || '-'}</td>
                        <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>{Number(record.poin || 0)} poin</td>
                        <td style={{ padding: '12px 14px' }}>{record.pencatat || 'OSIS/Piket'}</td>
                        <td style={{ padding: '12px 14px', minWidth: '170px' }}>{record.keterangan || record.tindakan || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
