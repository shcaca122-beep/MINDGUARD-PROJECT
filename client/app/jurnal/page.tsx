import Link from "next/link";

export default function Jurnal() {
  return (
    <div>

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

      <div className="prompt-card">
        <h1>📖 Jurnal pribadi</h1>

        <h2>Prompt Hari Ini</h2>

        <p>
          Apa yang membuat kamu merasa tenang?
        </p>

        <button
          style={{
            marginTop:"10px",
            padding:"8px 15px",
            borderRadius:"20px"
          }}
        >
          Ganti Prompt
        </button>
      </div>

      <div className="mood-card">
        <h2>Mood Minggu Ini</h2>

        <div className="days">
          <div className="day">Senin</div>
          <div className="day">Selasa</div>
          <div className="day">Rabu</div>
          <div className="day">Kamis</div>
          <div className="day">Jumat</div>
          <div className="day">Sabtu</div>
        </div>
      </div>

      <div className="form-card">
        <h2>Tulis Jurnal Baru</h2>

        <input
          className="form-input"
          placeholder="Judul"
        />

        <textarea
          className="form-textarea"
          placeholder="Ceritakan..."
        />

        <button
          className="submit-btn"
          style={{marginTop:"20px"}}
        >
          💾 Simpan Jurnal
        </button>
      </div>

    </div>
  );
}