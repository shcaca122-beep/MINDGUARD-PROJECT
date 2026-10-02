'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

type BKUser = {
  nama?: string;
  email?: string;
};

type CurhatRecord = {
  id: string | number;
  nama_siswa?: string;
  email_siswa?: string;
  kelas?: string;
  judul_pesan?: string;
  pesan?: string;
  topik?: string;
  balasan?: string;
  status?: string;
  tujuan_konselor?: string;
  created_at?: string;
};

export default function BKDashboardPage() {
  const router = useRouter();
  const [bkUser, setBkUser] = useState<BKUser | null>(null);
  const [curhatList, setCurhatList] = useState<CurhatRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('SEMUA');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // State Modal / Form Balasan Curhat
  const [selectedCurhat, setSelectedCurhat] = useState<CurhatRecord | null>(null);
  const [balasanText, setBalasanText] = useState<string>('');
  const [newStatus, setNewStatus] = useState<string>('DIBALAS');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCurhatData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('layanan_siswa')
        .select('*')
        .eq('layanan', 'CURHAT')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCurhatList((data || []) as CurhatRecord[]);
    } catch (error: unknown) {
      console.error('Error fetching curhat:', error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    Promise.resolve().then(() => {
      if (!isMounted) return;
      try {
        const rawSession = sessionStorage.getItem('bk_session') || sessionStorage.getItem('admin_session');
        if (!rawSession) {
          router.push('/');
          return;
        }
        setBkUser(JSON.parse(rawSession) as BKUser);
        void fetchCurhatData();
      } catch (error) {
        console.error('Gagal memeriksa sesi Guru BK:', error);
        router.push('/');
      }
    });
    return () => { isMounted = false; };
  }, [fetchCurhatData, router]);

  const handleLogout = () => {
    sessionStorage.removeItem('bk_session');
    sessionStorage.removeItem('admin_session');
    router.push('/');
  };

  const handleOpenBalasModal = (item: CurhatRecord) => {
    setSelectedCurhat(item);
    setBalasanText(item.balasan || '');
    setNewStatus(item.status === 'TERKIRIM' ? 'DIBALAS' : item.status || 'DIBALAS');
  };

  const handleSaveBalasan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCurhat) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('layanan_siswa')
        .update({
          balasan: balasanText,
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedCurhat.id);

      if (error) throw error;

      alert('✅ Balasan berhasil disimpan!');
      setSelectedCurhat(null);
      setBalasanText('');
      fetchCurhatData();
    } catch (error: unknown) {
      alert('❌ Gagal menyimpan balasan: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter pencarian dan status
  const filteredData = curhatList.filter((item) => {
    const matchStatus = filterStatus === 'SEMUA' || item.status === filterStatus;
    const matchQuery =
      item.nama_siswa?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.judul_pesan?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.pesan?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.kelas?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchStatus && matchQuery;
  });

  // Hitung Statistik
  const totalCurhat = curhatList.length;
  const pendingCurhat = curhatList.filter((c) => c.status === 'TERKIRIM' || !c.status).length;
  const completedCurhat = curhatList.filter((c) => c.status === 'DIBALAS' || c.status === 'SELESAI').length;

  if (!bkUser) return null;

  return (
    <div style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', fontFamily: 'sans-serif', color: '#1f2937', paddingBottom: '40px' }}>
      
      {/* NAVBAR */}
      <nav style={{ backgroundColor: '#1b3b2b', color: '#ffffff', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '28px' }}>👩‍🏫</span>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>MindGuard - Panel Guru BK</div>
            <div style={{ fontSize: '11px', color: '#a7f3d0' }}>Manajemen Curhat & Konseling Siswa</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{bkUser.nama || 'Guru BK'}</div>
            <div style={{ fontSize: '11px', color: '#a7f3d0' }}>{bkUser.email || 'Konselor'}</div>
          </div>
          <button onClick={handleLogout} style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
            🚪 Keluar
          </button>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main style={{ maxWidth: '1000px', margin: '24px auto', padding: '0 16px' }}>
        
        {/* STATISTIK CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: '#ffffff', padding: '18px', borderRadius: '14px', borderLeft: '5px solid #2563eb', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 'bold' }}>TOTAL CURHATAN</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', marginTop: '4px' }}>{totalCurhat}</div>
          </div>

          <div style={{ backgroundColor: '#ffffff', padding: '18px', borderRadius: '14px', borderLeft: '5px solid #d97706', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 'bold' }}>MENUNGGU TANGGAPAN</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#d97706', marginTop: '4px' }}>{pendingCurhat}</div>
          </div>

          <div style={{ backgroundColor: '#ffffff', padding: '18px', borderRadius: '14px', borderLeft: '5px solid #16a34a', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 'bold' }}>SUDAH DIBALAS / SELESAI</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#16a34a', marginTop: '4px' }}>{completedCurhat}</div>
          </div>
        </div>

        {/* SEARCH & FILTER BAR */}
        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '14px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="🔍 Cari nama siswa, kelas, atau isi curhat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: '1', minWidth: '240px', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px' }}
          />

          <div style={{ display: 'flex', gap: '8px' }}>
            {['SEMUA', 'TERKIRIM', 'DIBALAS', 'SELESAI'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  backgroundColor: filterStatus === st ? '#1b3b2b' : '#e5e7eb',
                  color: filterStatus === st ? '#ffffff' : '#374151'
                }}
              >
                {st === 'TERKIRIM' ? 'Belum Dibalas' : st}
              </button>
            ))}
          </div>
        </div>

        {/* LIST CURHATAN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {isLoading ? (
            <div style={{ backgroundColor: '#ffffff', padding: '30px', textAlign: 'center', borderRadius: '14px', color: '#6b7280' }}>
              ⌛ Memuat data curhatan siswa...
            </div>
          ) : filteredData.length === 0 ? (
            <div style={{ backgroundColor: '#ffffff', padding: '30px', textAlign: 'center', borderRadius: '14px', color: '#9ca3af' }}>
              Tidak ada data curhatan yang cocok.
            </div>
          ) : (
            filteredData.map((item) => (
              <div key={item.id} style={{ backgroundColor: '#ffffff', padding: '18px', borderRadius: '14px', border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
                
                {/* HEADER DARI CURHAT ITEM */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#111827' }}>
                      👤 {item.nama_siswa || 'Anonim'}
                    </span>
                    {item.kelas && item.kelas !== '-' && (
                      <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px', backgroundColor: '#f3f4f6', padding: '2px 8px', borderRadius: '6px' }}>
                        {item.kelas}
                      </span>
                    )}
                    <span style={{ fontSize: '11px', color: '#9ca3af', marginLeft: '10px' }}>
                      📧 {item.email_siswa}
                    </span>
                  </div>

                  <div>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 'bold',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      backgroundColor: item.status === 'DIBALAS' || item.status === 'SELESAI' ? '#d1fae5' : '#fef3c7',
                      color: item.status === 'DIBALAS' || item.status === 'SELESAI' ? '#065f46' : '#92400e'
                    }}>
                      {item.status || 'TERKIRIM'}
                    </span>
                  </div>
                </div>

                {/* PESAN & JUDUL CURHAT */}
                <div style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '10px', marginBottom: '12px', border: '1px solid #f3f4f6' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1e293b', marginBottom: '4px' }}>
                    📌 {item.judul_pesan || 'Tanpa Judul'}
                  </div>
                  <div style={{ fontSize: '13px', color: '#334155', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                    {item.pesan}
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '8px', textAlign: 'right' }}>
                    Tujuan Konselor: <b>{item.tujuan_konselor || 'Guru BK'}</b> | Tanggal: {item.created_at ? new Date(item.created_at).toLocaleString('id-ID') : '-'}
                  </div>
                </div>

                {/* DISPLAY BALASAN */}
                {item.balasan ? (
                  <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px', borderRadius: '10px', marginBottom: '12px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#166534', marginBottom: '4px' }}>
                      💬 Balasan Anda (Guru BK):
                    </div>
                    <div style={{ fontSize: '13px', color: '#14532d', whiteSpace: 'pre-wrap' }}>
                      {item.balasan}
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic', marginBottom: '12px' }}>
                    Belum ada respon untuk curhatan ini.
                  </div>
                )}

                {/* TOMBOL AKSI */}
                <button
                  onClick={() => handleOpenBalasModal(item)}
                  style={{
                    backgroundColor: '#1b3b2b',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  {item.balasan ? '✏️ Edit Balasan' : '💬 Balas Curhatan'}
                </button>

              </div>
            ))
          )}
        </div>

      </main>

      {/* MODAL RESPONS BK */}
      {selectedCurhat && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#ffffff', width: '100%', maxWidth: '550px', borderRadius: '16px', padding: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            
            <h3 style={{ margin: '0 0 12px 0', color: '#1b3b2b', fontSize: '18px' }}>
              💬 Balas Curhatan Siswa
            </h3>

            <div style={{ backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', fontSize: '12px', border: '1px solid #e2e8f0' }}>
              <div><b>Pengirim:</b> {selectedCurhat.nama_siswa} ({selectedCurhat.kelas || 'Siswa'})</div>
              <div><b>Judul:</b> {selectedCurhat.judul_pesan}</div>
            </div>

            <form onSubmit={handleSaveBalasan} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px' }}>
                  Status Layanan:
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px', backgroundColor: '#fff' }}
                >
                  <option value="DIBALAS">DIBALAS (Proses Konseling)</option>
                  <option value="SELESAI">SELESAI (Selesai Didampingi)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px' }}>
                  Isi Pesan Balasan / Tanggapan BK:
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Tuliskan masukan, tanggapan, atau ajakan konsultasi tatap muka..."
                  value={balasanText}
                  onChange={(e) => setBalasanText(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedCurhat(null)}
                  style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#f3f4f6', color: '#374151', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#1b3b2b', color: '#ffffff', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
                >
                  {isSubmitting ? '⌛ Menyimpan...' : '💾 Simpan & Kirim Balasan'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}