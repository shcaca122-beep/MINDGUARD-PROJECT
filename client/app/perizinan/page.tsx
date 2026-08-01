'use client';
import { useState } from 'react';

export default function FormPerizinanPage() {
  const [formData, setFormData] = useState({ jenis: 'Sakit', tanggalMulai: '', alasan: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Pengajuan izin berhasil dikirim!');
  };

  return (
    <div style={{ backgroundColor: '#cbe3cd', minHeight: '100vh', fontFamily: 'sans-serif', color: '#1f2937', margin: 0, padding: 0 }}>
      {/* Navbar Hijau Tua MindGuard */}
      <nav style={{ backgroundColor: '#1b3b2b', color: '#ffffff', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>🛡️</span>
          <span style={{ fontSize: '20px', fontWeight: 'bold' }}>MindGuard</span>
          <span style={{ fontSize: '12px', backgroundColor: '#2d523e', color: '#d1fae5', padding: '4px 12px', borderRadius: '20px' }}>Halaman Siswa</span>
        </div>
      </nav>

      {/* Form Container */}
      <main style={{ maxWidth: '520px', margin: '48px auto', padding: '0 16px' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '32px', borderRadius: '16px', border: '1px solid #b5d8b6', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', borderBottom: '1px solid #e2f0e3', paddingBottom: '16px' }}>
            <span style={{ fontSize: '24px' }}>📝</span>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1b3b2b', margin: 0 }}>Ajukan Surat Izin / Sakit</h1>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Jenis Perizinan</label>
              <select 
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #a8cda8', fontSize: '14px', outline: 'none' }}
                value={formData.jenis}
                onChange={(e) => setFormData({...formData, jenis: e.target.value})}
              >
                <option value="Sakit">Sakit</option>
                <option value="Izin">Izin</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Mulai Tanggal</label>
              <input 
                type="date" required
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #a8cda8', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                onChange={(e) => setFormData({...formData, tanggalMulai: e.target.value})}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Alasan / Keterangan</label>
              <textarea 
                required rows={4}
                placeholder="Tuliskan alasan izin/sakit secara detail..."
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #a8cda8', fontSize: '14px', outline: 'none', boxSizing: 'border-box', resize: 'none' }}
                onChange={(e) => setFormData({...formData, alasan: e.target.value})}
              ></textarea>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Upload Bukti Surat (Opsional)</label>
              <input type="file" style={{ fontSize: '13px', color: '#4b5563' }} />
            </div>

            <button 
              type="submit" 
              style={{ backgroundColor: '#1b3b2b', color: '#ffffff', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', marginTop: '10px' }}
            >
              Kirim Pengajuan 🚀
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}