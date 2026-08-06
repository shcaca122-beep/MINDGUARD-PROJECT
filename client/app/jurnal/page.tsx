'use client';

import { useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

export default function JurnalPage() {
  // --- STATE ---
  const [showModal, setShowModal] = useState(false);
  const [editingDayIndex, setEditingDayIndex] = useState<number | null>(null);
  const [selectedMood, setSelectedMood] = useState('😁');
  const [judul, setJudul] = useState('');
  const [isi, setIsi] = useState('');

  // List Prompt Inspirasi Hari Ini
  const listPrompt = [
    'Apa yang membuat kamu merasa tenang hari ini?',
    'Sebutkan 3 hal kecil yang patut kamu syukuri hari ini.',
    'Bagaimana caramu merawat dirimu saat merasa lelah?',
    'Apa pencapaian terbesarmu minggu ini, sekecil apa pun itu?',
    'Pesan apa yang ingin kamu sampaikan pada dirimu di masa depan?',
  ];
  const [promptIndex, setPromptIndex] = useState(0);

  // Data Stiker Mood Mingguan
  const [weeklyMoods, setWeeklyMoods] = useState([
    { day: 'Senin', sticker: '😁', color: '#fef08a' },
    { day: 'Selasa', sticker: '😌', color: '#bbf7d0' },
    { day: 'Rabu', sticker: '😴', color: '#e0e7ff' },
    { day: 'Kamis', sticker: '✨', color: '#fef08a' },
    { day: 'Jumat', sticker: '💖', color: '#fbcfe8' },
    { day: 'Sabtu', sticker: '🍃', color: '#d1fae5' },
  ]);

  // Handle Simpan Jurnal
  const handleSimpan = (e: React.FormEvent) => {
    e.preventDefault();
    setShowModal(true);
  };

  // Handle Ganti Prompt
  const handleGantiPrompt = () => {
    setPromptIndex((prev) => (prev + 1) % listPrompt.length);
  };

  // Handle Ubah Emoji Hari Tertentu
  const handleChangeDayEmoji = (newEmoji: string) => {
    if (editingDayIndex !== null) {
      const updated = [...weeklyMoods];
      updated[editingDayIndex].sticker = newEmoji;
      setWeeklyMoods(updated);
      setEditingDayIndex(null);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setJudul('');
    setIsi('');
  };

  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', display: 'flex', backgroundColor: '#d1f2d9' }}>
      
      {/* 🟢 SIDEBAR NAVIGASI PERMANEN */}
      <Sidebar />

      {/* ⚪ KONTEN UTAMA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowY: 'auto' }}>
        
        {/* TOP BAR */}
        <div style={{ backgroundColor: '#ffffff', padding: '16px 30px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h2 style={{ margin: 0, fontSize: '18px', color: '#1b3b2b', fontWeight: 'bold' }}>
            📖 Jurnal Pribadi Refleksi Diri
          </h2>
        </div>

        {/* BODY CONTENT */}
        <div style={{ flex: 1, padding: '30px 20px', maxWidth: '800px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
          
          {/* HEADER INFO */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 6px 0', color: '#1b3b2b' }}>
              Catatan Refleksi Diri
            </h1>
            <p style={{ margin: 0, fontSize: '14px', color: '#2d523e' }}>
              Tuliskan perasaanmu hari ini. Hanya kamu yang bisa melihatnya.
            </p>
          </div>

          {/* KARTU PROMPT HARI INI */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', marginBottom: '20px', border: '1px solid #b5d8b6', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '18px', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#1b3b2b', fontWeight: 'bold' }}>
              ⛅ Prompt Inspirasi Hari Ini
            </h2>
            <p style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#374151', fontStyle: 'italic', fontWeight: '600', lineHeight: '1.4' }}>
              “{listPrompt[promptIndex]}”
            </p>
            <button 
              type="button"
              onClick={handleGantiPrompt}
              style={{ backgroundColor: '#f3f4f6', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', color: '#1b3b2b' }}
            >
              🔄 Ganti Prompt
            </button>
          </div>

          {/* KARTU MOOD MINGGU INI */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', marginBottom: '20px', border: '1px solid #b5d8b6', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h2 style={{ fontSize: '18px', margin: 0, color: '#1b3b2b', fontWeight: 'bold' }}>
                📊 Mood Minggu Ini
              </h2>
              <span style={{ fontSize: '11px', color: '#6b7280', fontStyle: 'italic' }}>*Klik hari untuk ganti emoji</span>
            </div>
            
            {/* GRID KARTU HARI */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '10px' }}>
              {weeklyMoods.map((item, index) => (
                <div 
                  key={index} 
                  onClick={() => setEditingDayIndex(index)}
                  style={{ 
                    backgroundColor: item.color, 
                    border: '1.5px dashed #1b3b2b', 
                    borderRadius: '14px', 
                    padding: '12px 6px', 
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'transform 0.2s'
                  }}
                  title={`Klik untuk ubah mood hari ${item.day}`}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '13px', color: '#1b3b2b' }}>
                    {item.day}
                  </div>
                  <div style={{ 
                    fontSize: '24px', 
                    lineHeight: '1', 
                    backgroundColor: '#ffffff', 
                    borderRadius: '50%', 
                    width: '36px', 
                    height: '36px', 
                    margin: '0 auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #cbd5e1'
                  }}>
                    {item.sticker}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* KARTU TULIS JURNAL BARU */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', marginBottom: '30px', border: '1px solid #b5d8b6', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <form onSubmit={handleSimpan}>
              <h2 style={{ fontSize: '18px', margin: '0 0 16px 0', color: '#1b3b2b', fontWeight: 'bold' }}>
                ✍️ Tulis Jurnal Baru
              </h2>

              {/* INPUT JUDUL */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold', color: '#1b3b2b' }}>Judul Jurnal (Opsional)</label>
                <input 
                  type="text" 
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  placeholder="Berikan judul jurnalmu..."
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: '13px', outline: 'none' }} 
                />
              </div>

              {/* PILIH MOOD HARI INI */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold', color: '#1b3b2b' }}>Bagaimana Perasaanmu Saat Ini?</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['😁', '😌', '😞', '😡', '😭', '😵'].map((emoji, idx) => (
                    <button 
                      key={idx} 
                      type="button"
                      onClick={() => setSelectedMood(emoji)}
                      style={{ 
                        flex: 1, 
                        fontSize: '26px', 
                        padding: '8px 0', 
                        backgroundColor: selectedMood === emoji ? '#d1f2d9' : '#fff', 
                        border: selectedMood === emoji ? '2px solid #1b3b2b' : '1px solid #cbd5e1', 
                        borderRadius: '10px', 
                        cursor: 'pointer',
                        transform: selectedMood === emoji ? 'scale(1.05)' : 'scale(1)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* INPUT TEXTAREA */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold', color: '#1b3b2b' }}>Isi Cerita / Refleksi</label>
                <textarea 
                  required
                  rows={6} 
                  value={isi}
                  onChange={(e) => setIsi(e.target.value)}
                  placeholder="Tuliskan semua pikiran dan perasaanmu di sini..."
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: '13px', resize: 'vertical', outline: 'none' }}
                />
              </div>

              {/* TOMBOL SIMPAN */}
              <button 
                type="submit"
                style={{ width: '100%', padding: '12px', backgroundColor: '#1b3b2b', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', color: '#ffffff', boxShadow: '0 4px 10px rgba(27, 59, 43, 0.2)' }}
              >
                💾 Simpan Ke Jurnal Saya
              </button>
            </form>
          </div>

        </div>

        {/* FOOTER */}
        <footer style={{ backgroundColor: '#1b3b2b', color: '#ffffff', textAlign: 'center', padding: '15px', marginTop: 'auto' }}>
          <p style={{ margin: '0', fontSize: '11px', color: '#a7f3d0' }}>&copy; 2026 Ruang Tenang MindGuard - SMK Budi Bakti Ciwidey</p>
        </footer>

      </div>

      {/* 🔮 POP-UP EMOJI PICKER UNTUK HARI TERTENTU */}
      {editingDayIndex !== null && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '20px', maxWidth: '380px', width: '90%', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h3 style={{ color: '#1b3b2b', margin: '0 0 8px 0', fontSize: '18px', fontWeight: 'bold' }}>
              Pilih Mood Hari {weeklyMoods[editingDayIndex].day}
            </h3>
            <p style={{ color: '#6b7280', fontSize: '12px', marginBottom: '16px' }}>
              Pilih emoji yang menggambarkan perasaanmu di hari tersebut:
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '16px' }}>
              {['😁', '😌', '😞', '😡', '😭', '😵', '😴', '✨', '💖', '🍃'].map((emoji, idx) => (
                <button
                  key={idx}
                  onClick={() => handleChangeDayEmoji(emoji)}
                  style={{ fontSize: '26px', padding: '8px 12px', backgroundColor: '#f9fafb', border: '1px solid #cbd5e1', borderRadius: '10px', cursor: 'pointer' }}
                >
                  {emoji}
                </button>
              ))}
            </div>

            <button
              onClick={() => setEditingDayIndex(null)}
              style={{ backgroundColor: '#e5e7eb', color: '#374151', border: 'none', padding: '8px 20px', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* 🔮 POP-UP MODAL BERHASIL DISIMPAN */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#ffffff', padding: '28px 24px', borderRadius: '20px', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📖✨</div>
            <h2 style={{ color: '#1b3b2b', margin: '0 0 8px 0', fontSize: '20px', fontWeight: 'bold' }}>
              Jurnal Berhasil Disimpan!
            </h2>
            <p style={{ color: '#4b5563', fontSize: '13px', lineHeight: '1.5', marginBottom: '20px' }}>
              Catatan jurnalmu tersimpan rapi dan aman hanya di perangkatmu.
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={handleCloseModal}
                style={{ backgroundColor: '#e5e7eb', color: '#374151', border: 'none', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
              >
                Tulis Lagi
              </button>
              <Link href="/dashboard" style={{ textDecoration: 'none' }}>
                <button
                  style={{ backgroundColor: '#1b3b2b', color: '#ffffff', border: 'none', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                >
                  Ke Beranda 🏠
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}