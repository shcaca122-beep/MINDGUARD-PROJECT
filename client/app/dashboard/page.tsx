import Link from "next/link";

export default function Dashboard() {
  return (
    <div style={{ fontFamily: "sans-serif", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      
      {/* NAVBAR */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "30px", padding: "15px 40px", backgroundColor: "#fff" }}>
        <Link href="/dashboard" style={{ textDecoration: "none", color: "#000", fontSize: "14px" }}>Beranda</Link>
        <Link href="/curhat" style={{ textDecoration: "none", color: "#000", fontSize: "14px" }}>Curhat Anonim</Link>
        <Link href="/jurnal" style={{ textDecoration: "none", color: "#000", fontSize: "14px" }}>Jurnal Pribadi</Link>
      </div>

      {/* MAIN CONTENT AREA */}
      <div style={{ backgroundColor: "#d1f2d9", flex: 1, padding: "50px 20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        
        {/* HEADER UTAMA */}
        <h1 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "10px", color: "#000" }}>
          Selamat Datang di Ruang tenang
        </h1>
        <p style={{ margin: "0 0 5px 0", color: "#000", fontSize: "16px" }}>
          Pilih waktu luangmu, Pilih guru BK favoritmu.
        </p>
        <p style={{ margin: "0 0 30px 0", color: "#000", fontSize: "16px" }}>
          Konseling jadi lebih privat dan terjadwal.
        </p>

        {/* KARTU KUTIPAN (QUOTE CARD) */}
        <div style={{
          backgroundColor: "#fff",
          border: "1px solid #333",
          borderRadius: "15px",
          padding: "40px 60px",
          marginBottom: "40px",
          maxWidth: "700px",
          width: "100%",
          textAlign: "center"
        }}>
          <p style={{ fontSize: "24px", fontFamily: "Georgia, serif", margin: 0, color: "#000" }}>
            “Perasaanmu valid. Tidak apa-apa untuk merasa lelah.”
          </p>
        </div>

        {/* TOMBOL AKSI CEPAT (CTA BUTTONS) */}
        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "30px", marginBottom: "50px" }}>
          <Link href="/jurnal" style={{ textDecoration: "none" }}>
            <div style={{ padding: "10px 40px", borderRadius: "30px", border: "1px solid #333", backgroundColor: "#e0e0e0", color: "#000", display: "flex", alignItems: "center", gap: "15px", fontSize: "14px", cursor: "pointer" }}>
              <span style={{ fontSize: "18px" }}>📑</span> Mulai Menulis Jurnal
            </div>
          </Link>
          <Link href="/curhat" style={{ textDecoration: "none" }}>
            <div style={{ padding: "10px 40px", borderRadius: "30px", border: "1px solid #333", backgroundColor: "#e0e0e0", color: "#000", display: "flex", alignItems: "center", gap: "15px", fontSize: "14px", cursor: "pointer" }}>
              <span style={{ fontSize: "18px" }}>📩</span> Curhat Anonim
            </div>
          </Link>
        </div>

        {/* SUB-JUDUL FITUR */}
        <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "30px", color: "#000" }}>
          Fitur Ruang Tenang
        </h2>

        {/* GRID KARTU FITUR */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: "20px",
          maxWidth: "1000px",
          margin: "0 auto"
        }}>
          
          {/* KARTU 1: CURHAT ANONIM */}
          <div style={{ backgroundColor: "#fff", border: "1px solid #333", borderRadius: "15px", padding: "30px 20px", width: "200px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <span style={{ fontSize: "40px", marginBottom: "15px" }}>📩</span>
            <h3 style={{ margin: "0 0 15px 0", fontSize: "16px", fontWeight: "bold", color: "#000" }}>Curhat Anonim</h3>
            <p style={{ fontSize: "14px", margin: 0, lineHeight: "1.4", color: "#000" }}>
              Bagikan ceritamu tanpa khawatir. Identitasmu aman dan terlindungi.
            </p>
          </div>

          {/* KARTU 2: JURNAL PRIBADI */}
          <div style={{ backgroundColor: "#fff", border: "1px solid #333", borderRadius: "15px", padding: "30px 20px", width: "200px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <span style={{ fontSize: "40px", marginBottom: "15px" }}>📘</span>
            <h3 style={{ margin: "0 0 15px 0", fontSize: "16px", fontWeight: "bold", color: "#000" }}>Jurnal pribadi</h3>
            <p style={{ fontSize: "14px", margin: 0, lineHeight: "1.4", color: "#000" }}>
              Tulis perasaaanmu dan simpsn sebagai catatan pribadimu.
            </p>
          </div>

          {/* KARTU 3: AFIRMASI HARIAN */}
          <div style={{ backgroundColor: "#fff", border: "1px solid #333", borderRadius: "15px", padding: "30px 20px", width: "200px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <span style={{ fontSize: "40px", marginBottom: "15px" }}>📌</span>
            <h3 style={{ margin: "0 0 15px 0", fontSize: "16px", fontWeight: "bold", color: "#000" }}>Afirmasi Harian</h3>
            <p style={{ fontSize: "14px", margin: 0, lineHeight: "1.4", color: "#000" }}>
              Dapatkan kata-kata penyemangat setiap hari untuk menjaga mentalmu.
            </p>
          </div>

          {/* KARTU 4: MODE TENANG */}
          <div style={{ backgroundColor: "#fff", border: "1px solid #333", borderRadius: "15px", padding: "30px 20px", width: "200px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <span style={{ fontSize: "40px", marginBottom: "15px" }}>🌙</span>
            <h3 style={{ margin: "0 0 15px 0", fontSize: "16px", fontWeight: "bold", color: "#000" }}>Mode Tenang</h3>
            <p style={{ fontSize: "14px", margin: 0, lineHeight: "1.4", color: "#000" }}>
              Relaksasi dengan suasana tenang dan animasi pernapasan.
            </p>
          </div>

        </div>

      </div>

      {/* FOOTER */}
      <footer style={{ backgroundColor: "#000", color: "#fff", textAlign: "center", padding: "40px 20px" }}>
        <p style={{ margin: "5px 0", fontSize: "18px" }}>Ruang tenang - tempat berbagi Cerita</p>
        <p style={{ margin: "5px 0", fontSize: "18px" }}>Identitasmu aman. Semua curhat anonim</p>
        <p style={{ margin: "25px 0 10px 0", fontSize: "16px" }}>© 2026 Ruang Tenang. Made With Z-solution</p>
        <p style={{ margin: "0", fontSize: "16px", fontWeight: "bold" }}>SMK BUDI BAKTI CIWIDEY</p>
      </footer>

    </div>
  );
}