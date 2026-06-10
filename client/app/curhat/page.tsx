import Link from "next/link";

export default function Curhat() {
  return (
    <div className="page-wrapper">

      <div className="navbar">
        <Link href="/dashboard">Beranda</Link>
        <Link href="/curhat">Curhat Anonim</Link>
        <Link href="/jurnal">Jurnal Pribadi</Link>
      </div>

      <Link href="/dashboard">
        <button className="back-btn">
          ← Kembali
        </button>
      </Link>

      <div className="form-card">

        <h2>Bagikan Ceritamu</h2>

        <input
          className="form-input"
          placeholder="Judul Curhatan"
        />

        <textarea
          className="form-textarea"
          placeholder="Tuliskan apa yang kamu rasakan..."
        />

        <h3 style={{marginTop:"20px"}}>
          Butuh Bantuan Profesional?
        </h3>

        <select className="form-input">
          <option>Peer Konseling (Gratis)</option>
        </select>

        <button
          className="submit-btn"
          style={{marginTop:"30px"}}
        >
          ❤️ Kirim Curhat
        </button>

      </div>
    </div>
  );
}