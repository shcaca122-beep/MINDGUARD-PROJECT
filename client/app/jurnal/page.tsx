'use client';

import { useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { BookOpen, Sparkles, Calendar, PenTool, CheckCircle2, RotateCw } from 'lucide-react';

export default function JurnalPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingDayIndex, setEditingDayIndex] = useState<number | null>(null);
  const [selectedMood, setSelectedMood] = useState('😁');
  const [judul, setJudul] = useState('');
  const [isi, setIsi] = useState('');

  const listPrompt = [
    'Apa yang membuat kamu merasa tenang hari ini?',
    'Sebutkan 3 hal kecil yang patut kamu syukuri hari ini.',
    'Bagaimana caramu merawat dirimu saat merasa lelah?',
    'Apa pencapaian terbesarmu minggu ini, sekecil apa pun itu?',
    'Pesan apa yang ingin kamu sampaikan pada dirimu di masa depan?',
  ];
  const [promptIndex, setPromptIndex] = useState(0);

  const [weeklyMoods, setWeeklyMoods] = useState([
    { day: 'Senin', sticker: '😁', color: '#064e3b' },
    { day: 'Selasa', sticker: '😌', color: '#064e3b' },
    { day: 'Rabu', sticker: '😴', color: '#064e3b' },
    { day: 'Kamis', sticker: '✨', color: '#064e3b' },
    { day: 'Jumat', sticker: '💖', color: '#064e3b' },
    { day: 'Sabtu', sticker: '🍃', color: '#064e3b' },
  ]);

  const handleSimpan = (e: React.FormEvent) => {
    e.preventDefault();
    setShowModal(true);
  };

  const handleGantiPrompt = () => {
    setPromptIndex((prev) => (prev + 1) % listPrompt.length);
  };

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
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        body, html {
          background-color: #021f18 !important;
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          height: 100% !important;
          overflow-x: hidden !important;
        }
      ` }} />
      {/* DIPERBAIKI: Menggunakan width 100% agar simetris dan seimbang di tengah */}
      <div style={{ display: 'flex', minHeight: '100vh', width: '100%', background: 'linear-gradient(135deg, #021f18 0%, #032c22 35%, #054233 70%, #064e3b 100%)', fontFamily: 'system-ui, -apple-system, sans-serif', boxSizing: 'border-box' }}>
        
        {/* SIDEBAR */}
        <div style={{ background: '#021f18', borderRight: '1px solid rgba(52, 211, 153, 0.15)', flexShrink: 0 }}>
          <Sidebar />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowY: 'auto', width: '100%', boxSizing: 'border-box' }}>
          
          {/* TOP BAR GRADASI */}
          <div style={{ 
            background: 'linear-gradient(135deg, #021f18 0%, #064e3b 100%)', 
            color: '#ffffff', 
            padding: '18px 30px', 
            borderBottom: '1px solid rgba(52, 211, 153, 0.2)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <div style={{
              background: 'rgba(52, 211, 153, 0.15)',
              padding: '8px',
              borderRadius: '10px',
              border: '1px solid rgba(52, 211, 153, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BookOpen size={22} color="#34d399" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', color: '#ffffff', fontWeight: '700', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                Jurnal Pribadi Refleksi Diri[cite: 10]
              </h2>
              <span style={{ fontSize: '11.5px', color: '#a7f3d0', fontWeight: '500' }}>Catatan harian privat untuk menjaga kesehatan mental[cite: 10]</span>
            </div>
          </div>

          <div style={{ flex: 1, padding: '30px', maxWidth: '1000px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
            
            <div style={{ textAlign: 'center', marginBottom: '25px', width: '100%', boxSizing: 'border-box' }}>
              <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 6px 0', color: '#ffffff' }}>
                Catatan Refleksi Diri
              </h1>
              <p style={{ margin: 0, fontSize: '13px', color: '#a7f3d0', fontWeight: '500' }}>
                Tuliskan perasaanmu hari ini. Hanya kamu yang bisa melihatnya.[cite: 10]
              </p>
            </div>

            {/* KARTU PROMPT */}
            <div style={{ backgroundColor: 'rgba(2, 31, 24, 0.85)', backdropFilter: 'blur(12px)', borderRadius: '16px', padding: '24px', marginBottom: '25px', border: '1px solid rgba(52, 211, 153, 0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', width: '100%', boxSizing: 'border-box' }}>
              <h2 style={{ fontSize: '16px', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#ecfdf5', fontWeight: '700' }}>
                <Sparkles size={18} color="#34d399" />
                Prompt Inspirasi Hari Ini[cite: 10]
              </h2>
              <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#e2e8f0', fontStyle: 'italic', fontWeight: '600', lineHeight: '1.4' }}>
                “{listPrompt[promptIndex]}”[cite: 10]
              </p>
              <button 
                type="button"
                onClick={handleGantiPrompt}
                style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(52, 211, 153, 0.3)', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', color: '#ffffff', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s ease' }}
              >
                <RotateCw size={13} color="#34d399" />
                <span>Ganti Prompt</span>
              </button>
            </div>

            {/* KARTU MOOD MINGGU INI */}
            <div style={{ backgroundColor: 'rgba(2, 31, 24, 0.85)', backdropFilter: 'blur(12px)', borderRadius: '16px', padding: '24px', marginBottom: '25px', border: '1px solid rgba(52, 211, 153, 0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', width: '100%', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <h2 style={{ fontSize: '16px', margin: 0, color: '#ecfdf5', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={18} color="#34d399" />
                  Mood Minggu Ini[cite: 10]
                </h2>
                <span style={{ fontSize: '11.5px', color: '#a7f3d0', fontStyle: 'italic' }}>*Klik hari untuk ganti emoji[cite: 10]</span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '12px', width: '100%', boxSizing: 'border-box' }}>
                {weeklyMoods.map((item, index) => (
                  <div 
                    key={index} 
                    onClick={() => setEditingDayIndex(index)}
                    style={{ 
                      backgroundColor: '#021f18', 
                      border: '1px solid rgba(52, 211, 153, 0.3)', 
                      borderRadius: '12px', 
                      padding: '14px 8px', 
                      textAlign: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                      boxSizing: 'border-box'
                    }}
                    title={`Klik untuk ubah mood hari ${item.day}`}
                  >
                    <div style={{ fontWeight: '700', marginBottom: '8px', fontSize: '12px', color: '#a7f3d0' }}>
                      {item.day}
                    </div>
                    <div style={{ 
                      fontSize: '22px', 
                      lineHeight: '1', 
                      backgroundColor: '#064e3b', 
                      borderRadius: '50%', 
                      width: '36px', 
                      height: '36px', 
                      margin: '0 auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(52, 211, 153, 0.3)'
                    }}>
                      {item.sticker}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* KARTU TULIS JURNAL BARU */}
            <div style={{ backgroundColor: 'rgba(2, 31, 24, 0.85)', backdropFilter: 'blur(12px)', borderRadius: '16px', padding: '24px', marginBottom: '30px', border: '1px solid rgba(52, 211, 153, 0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', width: '100%', boxSizing: 'border-box' }}>
              <form onSubmit={handleSimpan} style={{ width: '100%', boxSizing: 'border-box' }}>
                <h2 style={{ fontSize: '16px', margin: '0 0 16px 0', color: '#ecfdf5', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <PenTool size={18} color="#34d399" />
                  Tulis Jurnal Baru[cite: 10]
                </h2>

                <div style={{ marginBottom: '16px', width: '100%', boxSizing: 'border-box' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '700', color: '#cbd5e1' }}>Judul Jurnal (Opsional)[cite: 10]</label>
                  <input 
                    type="text" 
                    value={judul}
                    onChange={(e) => setJudul(e.target.value)}
                    placeholder="Berikan judul jurnalmu..."
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.3)', boxSizing: 'border-box', fontSize: '13px', outline: 'none', backgroundColor: '#021f18', color: '#fff' }} 
                  />
                </div>

                <div style={{ marginBottom: '16px', width: '100%', boxSizing: 'border-box' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '700', color: '#cbd5e1' }}>Bagaimana Perasaanmu Saat Ini?[cite: 10]</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {['😁', '😌', '😞', '😡', '😭', '😵'].map((emoji, idx) => (
                      <button 
                        key={idx} 
                        type="button"
                        onClick={() => setSelectedMood(emoji)}
                        style={{ 
                          flex: 1, 
                          minWidth: '40px',
                          fontSize: '24px', 
                          padding: '8px 0', 
                          backgroundColor: selectedMood === emoji ? '#064e3b' : '#021f18', 
                          border: selectedMood === emoji ? '2px solid #34d399' : '1px solid rgba(52, 211, 153, 0.2)', 
                          borderRadius: '10px', 
                          cursor: 'pointer',
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '20px', width: '100%', boxSizing: 'border-box' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '700', color: '#cbd5e1' }}>Isi Cerita / Refleksi[cite: 10]</label>
                  <textarea 
                    required
                    rows={6} 
                    value={isi}
                    onChange={(e) => setIsi(e.target.value)}
                    placeholder="Tuliskan semua pikiran dan perasaanmu di sini..."
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.3)', boxSizing: 'border-box', fontSize: '13px', resize: 'vertical', outline: 'none', backgroundColor: '#021f18', color: '#fff' }}
                  />
                </div>

                <button 
                  type="submit"
                  style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #059669 0%, #047857 50%, #064e3b 100%)', border: 'none', borderRadius: '10px', fontSize: '13.5px', fontWeight: '700', cursor: 'pointer', color: '#ffffff', boxShadow: '0 4px 15px rgba(5, 150, 105, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxSizing: 'border-box' }}
                >
                  <CheckCircle2 size={16} color="#a7f3d0" />
                  <span>Simpan Ke Jurnal Saya[cite: 10]</span>
                </button>
              </form>
            </div>

          </div>

          <footer style={{ background: 'linear-gradient(135deg, #021f18 0%, #064e3b 100%)', color: '#a7f3d0', textAlign: 'center', padding: '16px', marginTop: 'auto', borderTop: '1px solid rgba(52, 211, 153, 0.2)', width: '100%', boxSizing: 'border-box' }}>
            <p style={{ margin: '0', fontSize: '11.5px', color: '#a7f3d0' }}>&copy; 2026 Ruang Tenang MindGuard - SMK Budi Bakti Ciwidey[cite: 10]</p>
          </footer>

        </div>

        {editingDayIndex !== null && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '15px', boxSizing: 'border-box' }}>
            <div style={{ backgroundColor: '#021f18', padding: '24px', borderRadius: '16px', maxWidth: '380px', width: '100%', textAlign: 'center', boxShadow: '0 8px 30px rgba(0,0,0,0.6)', border: '1px solid rgba(52, 211, 153, 0.3)', boxSizing: 'border-box' }}>
              <h3 style={{ color: '#ffffff', margin: '0 0 8px 0', fontSize: '16px', fontWeight: '700' }}>
                Pilih Mood Hari {weeklyMoods[editingDayIndex].day}[cite: 10]
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '16px' }}>
                Pilih emoji yang menggambarkan perasaanmu di hari tersebut:[cite: 10]
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '16px' }}>
                {['😁', '😌', '😞', '😡', '😭', '😵', '😴', '✨', '💖', '🍃'].map((emoji, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleChangeDayEmoji(emoji)}
                    style={{ fontSize: '24px', padding: '8px 12px', backgroundColor: '#064e3b', border: '1px solid rgba(52, 211, 153, 0.3)', borderRadius: '10px', cursor: 'pointer' }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setEditingDayIndex(null)}
                style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#ffffff', border: '1px solid rgba(52, 211, 153, 0.3)', padding: '8px 20px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
              >
                Batal
              </button>
            </div>
          </div>
        )}

        {showModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '15px', boxSizing: 'border-box' }}>
            <div style={{ backgroundColor: '#021f18', padding: '28px 24px', borderRadius: '16px', maxWidth: '400px', width: '100%', textAlign: 'center', boxShadow: '0 8px 30px rgba(0,0,0,0.6)', border: '1px solid rgba(52, 211, 153, 0.3)', boxSizing: 'border-box' }}>
              <h2 style={{ color: '#ffffff', margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700' }}>
                Jurnal Berhasil Disimpan![cite: 10]
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.5', marginBottom: '20px' }}>
                Catatan jurnalmu tersimpan rapi dan aman hanya di perangkatmu.[cite: 10]
              </p>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={handleCloseModal}
                  style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#ffffff', border: '1px solid rgba(52, 211, 153, 0.3)', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}
                >
                  Tulis Lagi[cite: 10]
                </button>
                <Link href="/dashboard" style={{ textDecoration: 'none' }}>
                  <button
                    style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 50%, #064e3b 100%)', color: '#ffffff', border: 'none', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12px', boxShadow: '0 4px 15px rgba(5, 150, 105, 0.4)' }}
                  >
                    Ke Beranda[cite: 10]
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}