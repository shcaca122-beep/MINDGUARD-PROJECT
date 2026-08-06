'use client';

import Link from "next/link";
import Sidebar from "@/components/Sidebar";

export default function DashboardPage() {
  return (
    <div style={{ fontFamily: "sans-serif", minHeight: "100vh", display: "flex", backgroundColor: "#d1f2d9" }}>
      
      {/* 🟢 SIDEBAR PERMANEN */}
      <Sidebar />

      {/* ⚪ KONTEN UTAMA */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh", overflowY: "auto" }}>
        
        {/* TOP BAR */}
        <div style={{
          backgroundColor: "#ffffff",
          padding: "16px 30px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
        }}>
          <h2 style={{ margin: 0, fontSize: "18px", color: "#1b3b2b", fontWeight: "bold" }}>
            Dashboard Ruang Tenang
          </h2>
          <span style={{ fontSize: "14px", fontWeight: "bold", color: "#1b3b2b" }}>👋 Selamat Datang, Siswa!</span>
        </div>

        {/* ISI KONTEN */}
        <div style={{ flex: 1, padding: "40px 20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          
          {/* HEADER UTAMA */}
          <h1 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "10px", color: "#1b3b2b", textAlign: "center" }}>
            Selamat Datang di Ruang Tenang
          </h1>
          <p style={{ margin: "0 0 6px 0", color: "#374151", fontSize: "16px", textAlign: "center" }}>
            Pilih waktu luangmu, pilih guru BK favoritmu.
          </p>
          <p style={{ margin: "0 0 30px 0", color: "#374151", fontSize: "16px", textAlign: "center" }}>
            Konseling jadi lebih privat dan terjadwal.
          </p>

          {/* KARTU QUOTE */}
          <div style={{
            backgroundColor: "#ffffff",
            border: "1px solid #1b3b2b",
            borderRadius: "15px",
            padding: "30px 40px",
            marginBottom: "35px",
            maxWidth: "700px",
            width: "100%",
            textAlign: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            boxSizing: "border-box"
          }}>
            <p style={{ fontSize: "22px", fontFamily: "Georgia, serif", margin: 0, color: "#1b3b2b", fontStyle: "italic" }}>
              “Perasaanmu valid. Tidak apa-apa untuk merasa lelah.”
            </p>
          </div>

          {/* TOMBOL AKSI CEPAT (4 TOMBOL UTAMA) */}
          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "15px", marginBottom: "45px" }}>
            <Link href="/booking" style={{ textDecoration: "none" }}>
              <div style={{ padding: "12px 24px", borderRadius: "30px", backgroundColor: "#1b3b2b", color: "#ffffff", display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 10px rgba(27, 59, 43, 0.25)" }}>
                <span>📅</span> Booking Konseling BK
              </div>
            </Link>
            <Link href="/curhat" style={{ textDecoration: "none" }}>
              <div style={{ padding: "12px 24px", borderRadius: "30px", border: "1px solid #1b3b2b", backgroundColor: "#ffffff", color: "#1b3b2b", display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", fontWeight: "bold", cursor: "pointer" }}>
                <span>📩</span> Curhat Anonim
              </div>
            </Link>
            <Link href="/jurnal" style={{ textDecoration: "none" }}>
              <div style={{ padding: "12px 24px", borderRadius: "30px", border: "1px solid #1b3b2b", backgroundColor: "#ffffff", color: "#1b3b2b", display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", fontWeight: "bold", cursor: "pointer" }}>
                <span>📘</span> Mulai Menulis Jurnal
              </div>
            </Link>
            <Link href="/perizinan" style={{ textDecoration: "none" }}>
              <div style={{ padding: "12px 24px", borderRadius: "30px", border: "1px solid #1b3b2b", backgroundColor: "#ffffff", color: "#1b3b2b", display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", fontWeight: "bold", cursor: "pointer" }}>
                <span>📝</span> Ajukan Izin / Sakit
              </div>
            </Link>
          </div>

          {/* SUB-JUDUL FITUR */}
          <h2 style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "25px", color: "#1b3b2b" }}>
            Fitur Utama Ruang Tenang
          </h2>

          {/* GRID KARTU FITUR (5 KARTU FITUR LENGKAP) */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "20px",
            maxWidth: "1050px",
            width: "100%",
            margin: "0 auto",
            marginBottom: "40px"
          }}>
            
            {/* KARTU 1: BOOKING BK */}
            <Link href="/booking" style={{ textDecoration: "none" }}>
              <div style={{ backgroundColor: "#ffffff", border: "1.5px solid #1b3b2b", borderRadius: "15px", padding: "25px 15px", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", boxSizing: "border-box", cursor: "pointer" }}>
                <span style={{ fontSize: "36px", marginBottom: "12px" }}>📅</span>
                <h3 style={{ margin: "0 0 10px 0", fontSize: "15px", fontWeight: "bold", color: "#1b3b2b" }}>Booking BK</h3>
                <p style={{ fontSize: "12px", margin: 0, lineHeight: "1.4", color: "#4b5563" }}>
                  Pilih guru BK dan tentukan jadwal konseling tatap muka secara privat.
                </p>
              </div>
            </Link>

            {/* KARTU 2: CURHAT ANONIM */}
            <Link href="/curhat" style={{ textDecoration: "none" }}>
              <div style={{ backgroundColor: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "15px", padding: "25px 15px", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", boxSizing: "border-box", cursor: "pointer" }}>
                <span style={{ fontSize: "36px", marginBottom: "12px" }}>📩</span>
                <h3 style={{ margin: "0 0 10px 0", fontSize: "15px", fontWeight: "bold", color: "#1b3b2b" }}>Curhat Anonim</h3>
                <p style={{ fontSize: "12px", margin: 0, lineHeight: "1.4", color: "#4b5563" }}>
                  Bagikan ceritamu tanpa khawatir. Identitasmu aman dan terlindungi.
                </p>
              </div>
            </Link>

            {/* KARTU 3: JURNAL PRIBADI */}
            <Link href="/jurnal" style={{ textDecoration: "none" }}>
              <div style={{ backgroundColor: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "15px", padding: "25px 15px", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", boxSizing: "border-box", cursor: "pointer" }}>
                <span style={{ fontSize: "36px", marginBottom: "12px" }}>📘</span>
                <h3 style={{ margin: "0 0 10px 0", fontSize: "15px", fontWeight: "bold", color: "#1b3b2b" }}>Jurnal Pribadi</h3>
                <p style={{ fontSize: "12px", margin: 0, lineHeight: "1.4", color: "#4b5563" }}>
                  Tulis perasaanmu dan simpan sebagai catatan refleksi harian.
                </p>
              </div>
            </Link>

            {/* KARTU 4: PERIZINAN SISWA */}
            <Link href="/perizinan" style={{ textDecoration: "none" }}>
              <div style={{ backgroundColor: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "15px", padding: "25px 15px", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", boxSizing: "border-box", cursor: "pointer" }}>
                <span style={{ fontSize: "36px", marginBottom: "12px" }}>📝</span>
                <h3 style={{ margin: "0 0 10px 0", fontSize: "15px", fontWeight: "bold", color: "#1b3b2b" }}>Perizinan Siswa</h3>
                <p style={{ fontSize: "12px", margin: 0, lineHeight: "1.4", color: "#4b5563" }}>
                  Kirim surat izin atau sakit langsung ke Guru BK secara online.
                </p>
              </div>
            </Link>

            {/* KARTU 5: AFIRMASI HARIAN */}
            <div style={{ backgroundColor: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "15px", padding: "25px 15px", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", boxSizing: "border-box" }}>
              <span style={{ fontSize: "36px", marginBottom: "12px" }}>📌</span>
              <h3 style={{ margin: "0 0 10px 0", fontSize: "15px", fontWeight: "bold", color: "#1b3b2b" }}>Afirmasi Harian</h3>
              <p style={{ fontSize: "12px", margin: 0, lineHeight: "1.4", color: "#4b5563" }}>
                Dapatkan motivasi positif harian untuk menjaga kesehatan mentalmu.
              </p>
            </div>

          </div>

        </div>

        {/* FOOTER */}
        <footer style={{ backgroundColor: "#1b3b2b", color: "#ffffff", textAlign: "center", padding: "24px 20px", marginTop: "auto" }}>
          <p style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "bold" }}>Ruang Tenang - Tempat Berbagi Cerita</p>
          <p style={{ margin: "0 0 12px 0", fontSize: "12px", color: "#a7f3d0" }}>Identitasmu aman. Semua curhat terlindungi.</p>
          <p style={{ margin: "0 0 2px 0", fontSize: "11px", color: "#a7f3d0" }}>&copy; 2026 Ruang Tenang. Made With Z-Solution</p>
          <p style={{ margin: "0", fontSize: "12px", fontWeight: "bold", color: "#ffffff" }}>SMK BUDI BAKTI CIWIDEY</p>
        </footer>

      </div>
    </div>
  );
}