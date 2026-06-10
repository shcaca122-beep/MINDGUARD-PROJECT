import Link from "next/link";

export default function Curhat() {
  return (
    <div className="page-wrapper">
      {/* NAVBAR */}
      <div className="navbar">
        <Link href="/dashboard">Beranda</Link>
        <Link href="/curhat">Curhat Anonim</Link>
        <Link href="/jurnal">Jurnal Pribadi</Link>
      </div>

      {/* TOMBOL KEMBALI */}
      <Link href="/dashboard">
        <button className="back-btn">
          ← Kembali
        </button>
      </Link>

      {/* HEADER UTAMA */}
      <div className="curhat-header" style={{ textAlign: "center", margin: "20px 0" }}>
        <h1>💬 Curhat Anonim</h1>
        <p>Ceritakan perasaanmu tanpa takut dihakimi. Identitasmu aman disini.</p>
      </div>

      {/* KARTU FORM */}
      <div className="form-card">
        
        <h2 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          📝 Bagikan Ceritamu
        </h2>

        {/* INPUT JUDUL */}
        <div className="input-group" style={{ marginTop: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            Judul Curhatan
          </label>
          <input
            className="form-input"
            placeholder="Contoh: Hari yang lelah..."
          />
        </div>

        {/* TEXTAREA ISI CURHATAN */}
        <div className="input-group" style={{ marginTop: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            Ceritakan perasaanmu
          </label>
          <textarea
            className="form-textarea"
            placeholder="Tuliskan apa yang ada dihatimu. Tidak ada yang akan menghakimi..."
            rows={6}
          />
        </div>

        {/* PILIHAN BANTUAN */}
        <h3 style={{ marginTop: "20px" }}>
          Butuh Bantuan Profesional?
        </h3>

        <select className="form-input">
          <option>Peer Konseling (Gratis)</option>
        </select>
        <small style={{ display: "block", marginTop: "5px", color: "#666" }}>
          *Pilih jenis bantuan yang kamu butuhkan
        </small>

        {/* TOMBOL KIRIM */}
        <button
          className="submit-btn"
          style={{ marginTop: "30px", width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}
        >
          💌 Kirim Curhat
        </button>

      </div>

      {/* FOOTER */}
      <footer style={{ backgroundColor: "#000", color: "#fff", textAlign: "center", padding: "30px 20px", marginTop: "5px" }}>
        <p>Ruang tenang - tempat berbagi Cerita</p>
        <p>Identitasmu aman. Semua curhat anonim</p>
        <p>© 2026 Ruang Tenang. Made With Z-solution</p>
        <p style={{ marginTop: "10px", fontWeight: "bold" }}>SMK BUDI BAKTI CIWIDEY</p>
      </footer>
    </div>
  );
}