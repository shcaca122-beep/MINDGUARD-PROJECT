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
      <div className="student-journal-page" style={{ display: 'flex', minHeight: '100vh', width: '100%', background: 'linear-gradient(135deg, #071a14 0%, #0a2b20 48%, #0d3829 100%)', fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif', boxSizing: 'border-box' }}>
        
        {/* SIDEBAR */}
        <div style={{ background: '#021f18', borderRight: '1px solid rgba(52, 211, 153, 0.15)', flexShrink: 0 }}>
          <Sidebar />
        </div>

        <div className="journal-content" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowY: 'auto', boxSizing: 'border-box' }}>
          
          {/* TOP BAR GRADASI */}
          <div style={{ 
            background: 'linear-gradient(135deg, #0a2119 0%, #103c2c 100%)', 
            color: '#ffffff', 
            padding: '20px 32px', 
            borderBottom: '1px solid rgba(110, 231, 183, 0.18)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <div style={{
              background: 'rgba(110, 231, 183, 0.1)',
              padding: '10px',
              borderRadius: '12px',
              border: '1px solid rgba(110, 231, 183, 0.22)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BookOpen size={22} color="#6ee7b7" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '19px', color: '#ffffff', fontWeight: '700', letterSpacing: '-0.02em' }}>
                Jurnal Pribadi Refleksi Diri
              </h2>
              <span style={{ display: 'block', marginTop: '3px', fontSize: '12px', color: '#b7d8c9', fontWeight: '400' }}>Catatan harian privat untuk menjaga kesehatan mental</span>
            </div>
          </div>

          <div style={{ flex: 1, padding: '36px 32px', maxWidth: '1080px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
            
            <div style={{ textAlign: 'center', marginBottom: '25px', width: '100%', boxSizing: 'border-box' }}>
              <h1 style={{ fontSize: '26px', fontWeight: '750', letterSpacing: '-0.035em', margin: '0 0 8px 0', color: '#f0fdf4' }}>
                Catatan Refleksi Diri
              </h1>
              <p style={{ margin: 0, fontSize: '14px', color: '#b7d8c9', fontWeight: '400', lineHeight: '1.6' }}>
                Tuliskan perasaanmu hari ini. Hanya kamu yang bisa melihatnya.
              </p>
            </div>

            {/* KARTU PROMPT */}
            <div style={{ background: 'linear-gradient(145deg, rgba(13, 49, 36, 0.96), rgba(7, 32, 24, 0.96))', backdropFilter: 'blur(12px)', borderRadius: '18px', padding: '26px', marginBottom: '22px', border: '1px solid rgba(110, 231, 183, 0.18)', boxShadow: '0 12px 30px rgba(0,0,0,0.18)', width: '100%', boxSizing: 'border-box' }}>
              <h2 style={{ fontSize: '16px', margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: '9px', color: '#ecfdf5', fontWeight: '650', letterSpacing: '-0.01em' }}>
                <Sparkles size={18} color="#34d399" />
                Prompt Inspirasi Hari Ini
              </h2>
              <p style={{ margin: '0 0 18px 0', fontSize: '16px', color: '#f1f5f9', fontStyle: 'normal', fontWeight: '500', lineHeight: '1.65', letterSpacing: '-0.01em' }}>
                “{listPrompt[promptIndex]}”
              </p>
              <button 
                type="button"
                onClick={handleGantiPrompt}
                style={{ backgroundColor: 'rgba(110, 231, 183,  0.08)', border: '1px solid rgba(110, 231, 183, 0.28)', padding: '9px 15px', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: '#d1fae5', display: 'inline-flex', alignItems: 'center', gap: '7px', transition: 'all 0.2s ease' }}
              >
                <RotateCw size={13} color="#34d399" />
                <span>Ganti Prompt</span>
              </button>
            </div>

            {/* KARTU MOOD MINGGU INI */}
            <div style={{ background: 'linear-gradient(145deg, rgba(13, 49, 36, 0.96), rgba(7, 32, 24, 0.96))', backdropFilter: 'blur(12px)', borderRadius: '18px', padding: '26px', marginBottom: '22px', border: '1px solid rgba(110, 231, 183, 0.18)', boxShadow: '0 12px 30px rgba(0,0,0,0.18)', width: '100%', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <h2 style={{ fontSize: '16px', margin: 0, color: '#ecfdf5', fontWeight: '650', display: 'flex', alignItems: 'center', gap: '9px', letterSpacing: '-0.01em' }}>
                  <Calendar size={18} color="#34d399" />
                  Mood Minggu Ini
                </h2>
                <span style={{ fontSize: '11.5px', color: '#a7f3d0', fontStyle: 'italic' }}>*Klik hari untuk ganti emoji</span>
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
            <div style={{ background: 'linear-gradient(145deg, rgba(13, 49, 36, 0.98), rgba(7, 32, 24, 0.98))', backdropFilter: 'blur(12px)', borderRadius: '18px', padding: '28px', marginBottom: '30px', border: '1px solid rgba(110, 231, 183, 0.22)', boxShadow: '0 16px 36px rgba(0,0,0,0.22)', width: '100%', boxSizing: 'border-box' }}>
              <form onSubmit={handleSimpan} style={{ width: '100%', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px', paddingBottom: '18px', borderBottom: '1px solid rgba(110, 231, 183, 0.14)' }}>
                  <div style={{ width: '42px', height: '42px', flexShrink: 0, borderRadius: '12px', background: 'rgba(110, 231, 183, 0.1)', border: '1px solid rgba(110, 231, 183, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PenTool size={19} color="#6ee7b7" />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '18px', lineHeight: '1.35', margin: 0, color: '#f0fdf4', fontWeight: '700', letterSpacing: '-0.025em' }}>Tulis Jurnal Baru</h2>
                    <p style={{ fontSize: '12px', lineHeight: '1.5', margin: '4px 0 0', color: '#a9cbbc' }}>Luangkan waktu sejenak untuk mencatat perasaan dan pengalamanmu.</p>
                  </div>
                </div>

                <div style={{ marginBottom: '16px', width: '100%', boxSizing: 'border-box' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', lineHeight: '1.4', fontWeight: '600', color: '#dcebe3' }}>Judul jurnal <span style={{ color: '#8fb1a0', fontWeight: '400' }}>(opsional)</span></label>
                  <input 
                    type="text" 
                    value={judul}
                    onChange={(e) => setJudul(e.target.value)}
                    placeholder="Contoh: Hal baik yang terjadi hari ini"
                    style={{ width: '100%', minHeight: '44px', padding: '11px 13px', borderRadius: '10px', border: '1px solid rgba(148, 190, 169, 0.3)', boxSizing: 'border-box', fontFamily: 'inherit', fontSize: '14px', lineHeight: '1.5', outline: 'none', backgroundColor: 'rgba(3, 24, 18, 0.7)', color: '#f0fdf4' }} 
                  />
                </div>

                <div style={{ marginBottom: '16px', width: '100%', boxSizing: 'border-box' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', lineHeight: '1.4', fontWeight: '600', color: '#dcebe3' }}>Bagaimana perasaanmu saat ini?</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: '10px' }}>
                    {['😁', '😌', '😞', '😡', '😭', '😵'].map((emoji, idx) => (
                      <button 
                        key={idx} 
                        type="button"
                        onClick={() => setSelectedMood(emoji)}
                        style={{ 
                          minWidth: 0,
                          minHeight: '52px',
                          fontSize: '23px',
                          padding: '8px 0',
                          backgroundColor: selectedMood === emoji ? 'rgba(16, 89, 62, 0.75)' : 'rgba(3, 24, 18, 0.62)',
                          border: selectedMood === emoji ? '1px solid #6ee7b7' : '1px solid rgba(148, 190, 169, 0.2)',
                          borderRadius: '11px',
                          cursor: 'pointer',
                          boxShadow: selectedMood === emoji ? '0 0 0 3px rgba(110, 231, 183, 0.1)' : 'none',
                          transition: 'all 0.18s ease',
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '20px', width: '100%', boxSizing: 'border-box' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', lineHeight: '1.4', fontWeight: '600', color: '#dcebe3' }}>Isi cerita dan refleksi</label>
                  <textarea 
                    required
                    rows={6} 
                    value={isi}
                    onChange={(e) => setIsi(e.target.value)}
                    placeholder="Tuliskan pikiran dan perasaanmu dengan nyaman. Catatan ini bersifat pribadi."
                    style={{ width: '100%', minHeight: '160px', padding: '13px', borderRadius: '10px', border: '1px solid rgba(148, 190, 169, 0.3)', boxSizing: 'border-box', fontFamily: 'inherit', fontSize: '14px', lineHeight: '1.7', resize: 'vertical', outline: 'none', backgroundColor: 'rgba(3, 24, 18, 0.7)', color: '#f0fdf4' }}
                  />
                </div>

                <button 
                  type="submit"
                  style={{ width: '100%', minHeight: '48px', padding: '12px 18px', background: 'linear-gradient(135deg, #16845e 0%, #0d6849 100%)', border: '1px solid rgba(167, 243, 208, 0.25)', borderRadius: '11px', fontFamily: 'inherit', fontSize: '14px', fontWeight: '650', letterSpacing: '0.01em', cursor: 'pointer', color: '#ffffff', boxShadow: '0 8px 18px rgba(5, 100, 68, 0.24)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px', boxSizing: 'border-box' }}
                >
                  <CheckCircle2 size={16} color="#a7f3d0" />
                  <span>Simpan Ke Jurnal Saya</span>
                </button>
              </form>
            </div>

          </div>

          <footer style={{ background: 'linear-gradient(135deg, #021f18 0%, #064e3b 100%)', color: '#a7f3d0', textAlign: 'center', padding: '16px', marginTop: 'auto', borderTop: '1px solid rgba(52, 211, 153, 0.2)', width: '100%', boxSizing: 'border-box' }}>
            <p style={{ margin: '0', fontSize: '11.5px', color: '#a7f3d0' }}>&copy; 2026 Ruang Tenang MindGuard - SMK Budi Bakti Ciwidey</p>
          </footer>

        </div>

        {editingDayIndex !== null && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '15px', boxSizing: 'border-box' }}>
            <div style={{ backgroundColor: '#021f18', padding: '24px', borderRadius: '16px', maxWidth: '380px', width: '100%', textAlign: 'center', boxShadow: '0 8px 30px rgba(0,0,0,0.6)', border: '1px solid rgba(52, 211, 153, 0.3)', boxSizing: 'border-box' }}>
              <h3 style={{ color: '#ffffff', margin: '0 0 8px 0', fontSize: '16px', fontWeight: '700' }}>
                Pilih Mood Hari {weeklyMoods[editingDayIndex].day}
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '16px' }}>
                Pilih emoji yang menggambarkan perasaanmu di hari tersebut:
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
                Jurnal Berhasil Disimpan!
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.5', marginBottom: '20px' }}>
                Catatan jurnalmu tersimpan rapi dan aman hanya di perangkatmu.
              </p>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={handleCloseModal}
                  style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#ffffff', border: '1px solid rgba(52, 211, 153, 0.3)', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}
                >
                  Tulis Lagi
                </button>
                <Link href="/dashboard" style={{ textDecoration: 'none' }}>
                  <button
                    style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 50%, #064e3b 100%)', color: '#ffffff', border: 'none', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12px', boxShadow: '0 4px 15px rgba(5, 150, 105, 0.4)' }}
                  >
                    Ke Beranda
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