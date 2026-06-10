import Link from "next/link";

export default function Jurnal() {
  return (
    <div style={{ fontFamily: "sans-serif", minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#d1f2d9" }}>
      
      {/* NAVBAR */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "30px", padding: "15px 40px", backgroundColor: "#fff" }}>
        <Link href="/dashboard" style={{ textDecoration: "none", color: "#000", fontSize: "14px" }}>Beranda</Link>
        <Link href="/curhat" style={{ textDecoration: "none", color: "#000", fontSize: "14px" }}>Curhat Anonim</Link>
        <Link href="/jurnal" style={{ textDecoration: "none", color: "#000", fontSize: "14px" }}>Jurnal Pribadi</Link>
      </div>

      {/* AREA KONTEN UTAMA */}
      <div style={{ flex: 1, padding: "20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        
        {/* TOMBOL KEMBALI */}
        <div style={{ width: "100%", maxWidth: "700px", display: "flex", justifyContent: "flex-start", marginBottom: "20px" }}>
          <Link href="/dashboard" style={{ textDecoration: "none" }}>
            <button style={{ padding: "8px 20px", borderRadius: "20px", border: "1px solid #777", backgroundColor: "#d1f2d9", cursor: "pointer", fontSize: "14px", color: "#000" }}>
              ← Kembali
            </button>
          </Link>
        </div>

        {/* HEADER JURNAL */}
        <div style={{ textAlign: "center", marginBottom: "30px", color: "#000" }}>
          <h1 style={{ fontSize: "24px", fontWeight: "bold", margin: "0 0 10px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
            📖 Jurnal pribadi
          </h1>
          <p style={{ margin: 0, fontSize: "14px" }}>
            Tuliskan perasaanmu hari ini. hanya kamu yang bisa melihatnya.
          </p>
        </div>

        {/* KARTU PROMPT HARI INI */}
        <div style={{ backgroundColor: "#dccbce", borderRadius: "20px", padding: "25px", maxWidth: "700px", width: "100%", marginBottom: "20px", border: "1px solid #777", boxSizing: "border-box" }}>
          <h2 style={{ fontSize: "20px", margin: "0 0 15px 0", display: "flex", alignItems: "center", gap: "10px", color: "#000" }}>
            ⛅ prompt Hari Ini
          </h2>
          <p style={{ margin: "0 0 20px 0", fontSize: "16px", color: "#000" }}>
            Apa yang membuat kamu merasa tenang?
          </p>
          <button style={{ backgroundColor: "#fff", border: "1px solid #ccc", padding: "8px 20px", borderRadius: "20px", cursor: "pointer", fontSize: "14px", fontWeight: "bold", color: "#000" }}>
            Ganti Prompt
          </button>
        </div>

        {/* KARTU MOOD MINGGU INI */}
        <div style={{ backgroundColor: "#fff", borderRadius: "20px", padding: "25px", maxWidth: "700px", width: "100%", marginBottom: "20px", border: "1px solid #777", boxSizing: "border-box" }}>
          <h2 style={{ fontSize: "20px", margin: "0 0 20px 0", display: "flex", alignItems: "center", gap: "10px", color: "#000" }}>
            📊 Mood Minggu Ini
          </h2>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
            {/* Render urutan hari. Note: 'kamis' huruf kecil disesuaikan dengan desain foto */}
            {["Senin", "Selasa", "Rabu", "kamis", "Jumat", "Sabtu"].map((day, index) => (
              <div key={index} style={{ backgroundColor: "#efefef", border: "1px solid #ccc", borderRadius: "15px", padding: "15px 10px", flex: 1, minWidth: "65px", textAlign: "center" }}>
                <div style={{ fontWeight: "bold", marginBottom: "15px", fontSize: "16px", color: "#000" }}>{day}</div>
                <div style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "#d1d1d1", margin: "0 auto", border: "1px solid #999" }}></div>
              </div>
            ))}
          </div>
        </div>

        {/* KARTU TULIS JURNAL BARU */}
        <div style={{ backgroundColor: "#fff", borderRadius: "20px", padding: "25px", maxWidth: "700px", width: "100%", marginBottom: "40px", border: "1px solid #777", boxSizing: "border-box" }}>
          <h2 style={{ fontSize: "20px", margin: "0 0 20px 0", display: "flex", alignItems: "center", gap: "10px", color: "#000" }}>
            ✍️ Tulis Jurnal Baru
          </h2>

          {/* INPUT JUDUL */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "#000" }}>Judul ( opsional )</label>
            <input type="text" style={{ width: "100%", padding: "12px", borderRadius: "15px", border: "1px solid #999", boxSizing: "border-box", fontSize: "14px" }} />
          </div>

          {/* PILIH MOOD HARI INI */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "#000" }}>Bagaimana perasaanmu hari ini?</label>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
              {["😁", "😞", "😡", "😭", "😵"].map((emoji, idx) => (
                <button key={idx} style={{ flex: 1, fontSize: "35px", padding: "10px 0", backgroundColor: "#fff", border: "1px solid #999", borderRadius: "15px", cursor: "pointer" }}>
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* INPUT TEXTAREA CERITAKAN */}
          <div style={{ marginBottom: "25px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "#000" }}>Ceritakan...</label>
            <textarea rows={8} style={{ width: "100%", padding: "12px", borderRadius: "15px", border: "1px solid #999", boxSizing: "border-box", fontSize: "14px", resize: "vertical" }}></textarea>
          </div>

          {/* TOMBOL SIMPAN */}
          <button style={{ width: "100%", padding: "15px", backgroundColor: "#c4baba", border: "1px solid #999", borderRadius: "25px", fontSize: "16px", fontWeight: "bold", cursor: "pointer", color: "#fff", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" }}>
            💾 Simpan jurnal
          </button>
        </div>

      </div>

      {/* FOOTER */}
      <footer style={{ backgroundColor: "#000", color: "#fff", textAlign: "center", padding: "40px 20px" }}>
        <p style={{ margin: "5px 0", fontSize: "14px" }}>Ruang tenang - tempat berbagi Cerita</p>
        <p style={{ margin: "5px 0", fontSize: "14px" }}>Identitasmu aman. Semua curhat anonim</p>
        <p style={{ margin: "15px 0 0 0", fontSize: "14px" }}>© 2026 Ruang Tenang. Made With Z-solution</p>
      </footer>

    </div>
  );
}