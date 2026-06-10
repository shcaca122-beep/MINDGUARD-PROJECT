import Link from "next/link";

export default function Dashboard() {
  return (
    <>
      <div className="navbar">
        <Link href="/dashboard">Beranda</Link>
        <Link href="/curhat">Curhat Anonim</Link>
        <Link href="/jurnal">Jurnal Pribadi</Link>
      </div>

      <div className="hero">
        <h1>Selamat Datang di Ruang Tenang</h1>

        <p>
          Pilih waktu luangmu, Pilih guru BK favoritmu.
        </p>

        <div className="quote-box">
          “Perasaanmu valid.
          Tidak apa-apa untuk merasa lelah.”
        </div>

        <div className="home-buttons">
          <Link href="/jurnal">
            <button>Mulai Menulis Jurnal</button>
          </Link>

          <Link href="/curhat">
            <button>Curhat Anonim</button>
          </Link>
        </div>

        <h1 style={{marginTop:"20px"}}>
          Fitur Ruang Tenang
        </h1>

        <div className="feature-grid">
          <div className="feature-card">
            Curhat Anonim
          </div>

          <div className="feature-card">
            Jurnal pribadi
          </div>

          <div className="feature-card">
            Afirmasi Harian
          </div>

          <div className="feature-card">
            Mode Tenang
          </div>
        </div>

        <div className="footer">
          <p>Ruang tenang - tempat berbagi Cerita</p>
          <p>Identitasmu aman. Semua curhat anonim</p>
          <p>© 2026 Ruang Tenang. Made With Z-solution</p>
          <p>SMK BUDI BAKTI CIWIDEY</p>
        </div>
      </div>
    </>
  );
}