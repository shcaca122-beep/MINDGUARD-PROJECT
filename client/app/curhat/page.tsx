'use client';
import { useState } from "react";
import Link from "next/link";

export default function Curhat() {
  // State untuk mengontrol pop-up modal
  const [showModal, setShowModal] = useState(false);
  const [judul, setJudul] = useState("");
  const [isi, setIsi] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowModal(true); // Tampilkan pop-up saat tombol dikirim
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setJudul(""); // Reset inputan
    setIsi("");
  };

  return (
    <div style={{ fontFamily: "sans-serif", minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#d1f2d9" }}>
      {/* NAVBAR */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "30px", padding: "15px 40px", backgroundColor: "#fff", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
        <Link href="/dashboard" style={{ textDecoration: "none", color: "#000", fontSize: "14px" }}>Beranda</Link>
        <Link href="/curhat" style={{ textDecoration: "none", color: "#000", fontSize: "14px", fontWeight: "bold" }}>Curhat Anonim</Link>
        <Link href="/jurnal" style={{ textDecoration: "none", color: "#000", fontSize: "14px" }}>Jurnal Pribadi</Link>
      </div>

      <div style={{ flex: 1, padding: "20px", maxWidth: "800px", margin: "0 auto", width: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "center" }}>
        
        {/* TOMBOL KEMBALI (DISAMAKAN PERSIS DENGAN JURNAL) */}
        <div style={{ width: "100%", display: "flex", justifyContent: "flex-start", marginBottom: "20px" }}>
          <Link href="/dashboard" style={{ textDecoration: "none" }}>
            <button style={{ padding: "8px 20px", borderRadius: "20px", border: "1px solid #777", backgroundColor: "#d1f2d9", cursor: "pointer", fontSize: "14px", color: "#000", fontWeight: "bold" }}>
              ← Kembali
            </button>
          </Link>
        </div>

        {/* HEADER UTAMA */}
        <div style={{ textAlign: "center", marginBottom: "25px", color: "#000" }}>
          <h1 style={{ fontSize: "26px", fontWeight: "bold", margin: "0 0 8px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
            💬 Curhat Anonim
          </h1>
          <p style={{ margin: 0, fontSize: "14px", color: "#4b5563" }}>Ceritakan perasaanmu tanpa takut dihakimi. Identitasmu aman di sini.</p>
        </div>

        {/* KARTU FORM */}
        <div style={{ backgroundColor: "#fff", padding: "30px", borderRadius: "20px", border: "1px solid #777", boxShadow: "0 4px 10px rgba(0,0,0,0.05)", width: "100%", boxSizing: "border-box" }}>
          <form onSubmit={handleSubmit}>
            <h2 style={{ display: "flex", alignItems: "center", gap: "10px", margin: "0 0 20px 0", fontSize: "20px", color: "#1b3b2b" }}>
              📝 Bagikan Ceritamu
            </h2>

            {/* INPUT JUDUL */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "14px", color: "#000" }}>
                Judul Curhatan
              </label>
              <input
                required
                placeholder="Contoh: Hari yang lelah..."
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                style={{ width: "100%", padding: "12px", borderRadius: "15px", border: "1px solid #999", boxSizing: "border-box", fontSize: "14px" }}
              />
            </div>

            {/* TEXTAREA ISI CURHATAN */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "14px", color: "#000" }}>
                Ceritakan perasaanmu
              </label>
              <textarea
                required
                placeholder="Tuliskan apa yang ada di hatimu. Tidak ada yang akan menghakimi..."
                rows={6}
                value={isi}
                onChange={(e) => setIsi(e.target.value)}
                style={{ width: "100%", padding: "12px", borderRadius: "15px", border: "1px solid #999", boxSizing: "border-box", fontSize: "14px", fontFamily: "sans-serif", resize: "vertical" }}
              />
            </div>

            {/* PILIHAN BANTUAN */}
            <h3 style={{ marginTop: "20px", fontSize: "16px", color: "#1b3b2b", marginBottom: "8px" }}>
              Butuh Bantuan Profesional?
            </h3>

            <select style={{ width: "100%", padding: "12px", borderRadius: "15px", border: "1px solid #999", fontSize: "14px" }}>
              <option>Peer Konseling (Gratis)</option>
              <option>Guru BK / Konselor Sekolah</option>
            </select>
            <small style={{ display: "block", marginTop: "6px", color: "#666" }}>
              *Pilih jenis bantuan yang kamu butuhkan
            </small>

            {/* TOMBOL KIRIM */}
            <button
              type="submit"
              style={{
                marginTop: "30px",
                width: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "#1b3b2b",
                color: "#ffffff",
                padding: "14px",
                borderRadius: "25px",
                border: "none",
                fontWeight: "bold",
                fontSize: "15px",
                cursor: "pointer",
                boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
              }}
            >
              💌 Kirim Curhat
            </button>
          </form>
        </div>
      </div>

      {/* 🔮 POP-UP MODAL CONFIRMATION */}
      {showModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
          backdropFilter: "blur(4px)"
        }}>
          <div style={{
            backgroundColor: "#ffffff",
            padding: "32px 24px",
            borderRadius: "20px",
            maxWidth: "420px",
            width: "90%",
            textAlign: "center",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            border: "2px solid #b5d8b6"
          }}>
            <div style={{ fontSize: "52px", marginBottom: "12px" }}>🕊️</div>
            <h2 style={{ color: "#1b3b2b", margin: "0 0 10px 0", fontSize: "22px", fontWeight: "bold" }}>
              Curhatan Berhasil Terkirim!
            </h2>
            <p style={{ color: "#4b5563", fontSize: "14px", lineHeight: "1.5", marginBottom: "24px" }}>
              Terima kasih sudah berani melepaskan bebanmu. Perasaanmu valid dan identitasmu dipastikan <strong>100% aman anonim</strong>.
            </p>

            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button
                onClick={handleCloseModal}
                style={{
                  backgroundColor: "#e5e7eb",
                  color: "#374151",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "13px"
                }}
              >
                Tulis Cerita Lain
              </button>
              <Link href="/dashboard" style={{ textDecoration: "none" }}>
                <button
                  style={{
                    backgroundColor: "#1b3b2b",
                    color: "#ffffff",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "10px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: "13px"
                  }}
                >
                  Ke Beranda 🏠
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer style={{ backgroundColor: "#000", color: "#fff", textAlign: "center", padding: "40px 20px", marginTop: "40px" }}>
        <p style={{ margin: "5px 0", fontSize: "14px" }}>Ruang Tenang - Tempat Berbagi Cerita</p>
        <p style={{ margin: "5px 0", fontSize: "14px" }}>Identitasmu aman. Semua curhat anonim</p>
        <p style={{ margin: "15px 0 5px 0", fontSize: "14px" }}>© 2026 Ruang Tenang. Made With Z-solution</p>
        <p style={{ margin: "0", fontWeight: "bold", fontSize: "14px" }}>SMK BUDI BAKTI CIWIDEY</p>
      </footer>
    </div>
  );
}