'use client';
import { useState } from "react";
import Link from "next/link";

export default function Jurnal() {
  // --- STATE ---
  const [showModal, setShowModal] = useState(false);
  const [editingDayIndex, setEditingDayIndex] = useState<number | null>(null); // State untuk ubah emoji per hari
  const [selectedMood, setSelectedMood] = useState("😁");
  const [judul, setJudul] = useState("");
  const [isi, setIsi] = useState("");
  
  // List Prompt Inspirasi Hari Ini
  const listPrompt = [
    "Apa yang membuat kamu merasa tenang hari ini?",
    "Sebutkan 3 hal kecil yang patut kamu syukuri hari ini.",
    "Bagaimana caramu merawat dirimu saat merasa lelah?",
    "Apa pencapaian terbesarmu minggu ini, sekecil apa pun itu?",
    "Pesan apa yang ingin kamu sampaikan pada dirimu di masa depan?"
  ];
  const [promptIndex, setPromptIndex] = useState(0);

  // Data Stiker Mood Mingguan
  const [weeklyMoods, setWeeklyMoods] = useState([
    { day: "Senin", sticker: "😁", color: "#fef08a" },
    { day: "Selasa", sticker: "😌", color: "#bbf7d0" },
    { day: "Rabu", sticker: "😴", color: "#e0e7ff" },
    { day: "Kamis", sticker: "✨", color: "#fef08a" },
    { day: "Jumat", sticker: "💖", color: "#fbcfe8" },
    { day: "Sabtu", sticker: "🍃", color: "#d1fae5" },
  ]);

  // Handle Simpan Jurnal
  const handleSimpan = (e: React.FormEvent) => {
    e.preventDefault();
    setShowModal(true);
  };

  // Handle Ganti Prompt
  const handleGantiPrompt = () => {
    setPromptIndex((prev) => (prev + 1) % listPrompt.length);
  };

  // Handle Ubah Emoji Hari Tertentu
  const handleChangeDayEmoji = (newEmoji: string) => {
    if (editingDayIndex !== null) {
      const updated = [...weeklyMoods];
      updated[editingDayIndex].sticker = newEmoji;
      setWeeklyMoods(updated);
      setEditingDayIndex(null); // Tutup pop-up edit hari
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setJudul("");
    setIsi("");
  };

  return (
    <div style={{ fontFamily: "sans-serif", minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#d1f2d9" }}>
      
      {/* NAVBAR */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 40px", backgroundColor: "#fff", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "22px" }}>🛡️</span>
          <span style={{ fontSize: "18px", fontWeight: "bold", color: "#1b3b2b" }}>MindGuard</span>
        </div>
        <div style={{ display: "flex", gap: "25px", alignItems: "center" }}>
          <Link href="/dashboard" style={{ textDecoration: "none", color: "#000", fontSize: "14px" }}>Beranda</Link>
          <Link href="/curhat" style={{ textDecoration: "none", color: "#000", fontSize: "14px" }}>Curhat Anonim</Link>
          <Link href="/jurnal" style={{ textDecoration: "none", color: "#000", fontSize: "14px", fontWeight: "bold" }}>Jurnal Pribadi</Link>
          <Link href="/perizinan" style={{ textDecoration: "none", color: "#000", fontSize: "14px" }}>📝 Perizinan</Link>
        </div>
      </div>

      {/* AREA KONTEN UTAMA */}
      <div style={{ flex: 1, padding: "20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        
        {/* TOMBOL KEMBALI */}
        <div style={{ width: "100%", maxWidth: "700px", display: "flex", justifyContent: "flex-start", marginBottom: "20px" }}>
          <Link href="/dashboard" style={{ textDecoration: "none" }}>
            <button style={{ padding: "8px 20px", borderRadius: "20px", border: "1px solid #777", backgroundColor: "#fff", cursor: "pointer", fontSize: "14px", color: "#000", fontWeight: "bold" }}>
              ← Kembali
            </button>
          </Link>
        </div>

        {/* HEADER JURNAL */}
        <div style={{ textAlign: "center", marginBottom: "30px", color: "#000" }}>
          <h1 style={{ fontSize: "26px", fontWeight: "bold", margin: "0 0 10px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
            📖 Jurnal Pribadi
          </h1>
          <p style={{ margin: 0, fontSize: "15px", color: "#2d523e" }}>
            Tuliskan perasaanmu hari ini. Hanya kamu yang bisa melihatnya.
          </p>
        </div>

        {/* KARTU PROMPT HARI INI */}
        <div style={{ backgroundColor: "#dccbce", borderRadius: "20px", padding: "25px", maxWidth: "700px", width: "100%", marginBottom: "20px", border: "1px solid #777", boxSizing: "border-box" }}>
          <h2 style={{ fontSize: "20px", margin: "0 0 15px 0", display: "flex", alignItems: "center", gap: "10px", color: "#000" }}>
            ⛅ Prompt Hari Ini
          </h2>
          <p style={{ margin: "0 0 20px 0", fontSize: "16px", color: "#000", fontStyle: "italic", fontWeight: "600" }}>
            “{listPrompt[promptIndex]}”
          </p>
          <button 
            type="button"
            onClick={handleGantiPrompt}
            style={{ backgroundColor: "#fff", border: "1px solid #ccc", padding: "8px 20px", borderRadius: "20px", cursor: "pointer", fontSize: "14px", fontWeight: "bold", color: "#000" }}
          >
            🔄 Ganti Prompt
          </button>
        </div>

        {/* KARTU MOOD MINGGU INI (KARTU HARI BISA DIKLIK) */}
        <div style={{ backgroundColor: "#fff", borderRadius: "20px", padding: "25px", maxWidth: "700px", width: "100%", marginBottom: "20px", border: "1px solid #777", boxSizing: "border-box" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <h2 style={{ fontSize: "20px", margin: 0, display: "flex", alignItems: "center", gap: "10px", color: "#000" }}>
              📊 Mood Minggu Ini
            </h2>
            <span style={{ fontSize: "12px", color: "#666", fontStyle: "italic" }}>*Klik hari untuk ganti emoji</span>
          </div>
          
          {/* GRID KARTU HARI */}
          <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
            {weeklyMoods.map((item, index) => (
              <div 
                key={index} 
                onClick={() => setEditingDayIndex(index)}
                style={{ 
                  backgroundColor: item.color, 
                  border: "2px dashed #1b3b2b", 
                  borderRadius: "16px", 
                  padding: "15px 8px", 
                  flex: 1, 
                  minWidth: "70px", 
                  textAlign: "center",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                  cursor: "pointer",
                  transition: "transform 0.2s"
                }}
                title={`Klik untuk ubah mood hari ${item.day}`}
              >
                <div style={{ fontWeight: "bold", marginBottom: "10px", fontSize: "14px", color: "#1b3b2b" }}>
                  {item.day}
                </div>
                {/* STIKER MOOD BADGE */}
                <div style={{ 
                  fontSize: "28px", 
                  lineHeight: "1", 
                  padding: "6px", 
                  backgroundColor: "#ffffff", 
                  borderRadius: "50%", 
                  width: "40px", 
                  height: "40px", 
                  margin: "0 auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid #cbd5e1"
                }}>
                  {item.sticker}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* KARTU TULIS JURNAL BARU */}
        <div style={{ backgroundColor: "#fff", borderRadius: "20px", padding: "25px", maxWidth: "700px", width: "100%", marginBottom: "40px", border: "1px solid #777", boxSizing: "border-box" }}>
          <form onSubmit={handleSimpan}>
            <h2 style={{ fontSize: "20px", margin: "0 0 20px 0", display: "flex", alignItems: "center", gap: "10px", color: "#000" }}>
              ✍️ Tulis Jurnal Baru
            </h2>

            {/* INPUT JUDUL */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "bold", color: "#000" }}>Judul ( opsional )</label>
              <input 
                type="text" 
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                placeholder="Berikan judul jurnalmu..."
                style={{ width: "100%", padding: "12px", borderRadius: "15px", border: "1px solid #999", boxSizing: "border-box", fontSize: "14px" }} 
              />
            </div>

            {/* PILIH MOOD HARI INI */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "bold", color: "#000" }}>Bagaimana perasaanmu hari ini?</label>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
                {["😁", "😌", "😞", "😡", "😭", "😵"].map((emoji, idx) => (
                  <button 
                    key={idx} 
                    type="button"
                    onClick={() => setSelectedMood(emoji)}
                    style={{ 
                      flex: 1, 
                      fontSize: "30px", 
                      padding: "8px 0", 
                      backgroundColor: selectedMood === emoji ? "#d1f2d9" : "#fff", 
                      border: selectedMood === emoji ? "2px solid #1b3b2b" : "1px solid #999", 
                      borderRadius: "15px", 
                      cursor: "pointer",
                      transform: selectedMood === emoji ? "scale(1.08)" : "scale(1)",
                      transition: "all 0.2s ease"
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* INPUT TEXTAREA CERITAKAN */}
            <div style={{ marginBottom: "25px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "bold", color: "#000" }}>Ceritakan...</label>
              <textarea 
                required
                rows={8} 
                value={isi}
                onChange={(e) => setIsi(e.target.value)}
                placeholder="Tuliskan semua pikiran dan perasaanmu di sini..."
                style={{ width: "100%", padding: "12px", borderRadius: "15px", border: "1px solid #999", boxSizing: "border-box", fontSize: "14px", resize: "vertical", fontFamily: "sans-serif" }}
              />
            </div>

            {/* TOMBOL SIMPAN */}
            <button 
              type="submit"
              style={{ width: "100%", padding: "15px", backgroundColor: "#1b3b2b", border: "none", borderRadius: "25px", fontSize: "16px", fontWeight: "bold", cursor: "pointer", color: "#fff", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}
            >
              💾 Simpan Jurnal
            </button>
          </form>
        </div>

      </div>

      {/* 🔮 POP-UP EMOJI PICKER UNTUK HARI TERTENTU */}
      {editingDayIndex !== null && (
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
            padding: "24px",
            borderRadius: "20px",
            maxWidth: "380px",
            width: "90%",
            textAlign: "center",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            border: "2px solid #b5d8b6"
          }}>
            <h3 style={{ color: "#1b3b2b", margin: "0 0 10px 0", fontSize: "18px", fontWeight: "bold" }}>
              Pilih Mood Hari {weeklyMoods[editingDayIndex].day}
            </h3>
            <p style={{ color: "#666", fontSize: "13px", marginBottom: "18px" }}>
              Pilih emoji stiker yang menggambarkan perasaanmu di hari ini:
            </p>

            {/* PILIHAN STIKER */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center", marginBottom: "20px" }}>
              {["😁", "😌", "😞", "😡", "😭", "😵", "😴", "✨", "💖", "🍃"].map((emoji, idx) => (
                <button
                  key={idx}
                  onClick={() => handleChangeDayEmoji(emoji)}
                  style={{
                    fontSize: "28px",
                    padding: "8px 12px",
                    backgroundColor: "#f3f4f6",
                    border: "1px solid #cbd5e1",
                    borderRadius: "12px",
                    cursor: "pointer",
                    transition: "transform 0.1s"
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>

            <button
              onClick={() => setEditingDayIndex(null)}
              style={{
                backgroundColor: "#e5e7eb",
                color: "#374151",
                border: "none",
                padding: "8px 20px",
                borderRadius: "10px",
                fontWeight: "bold",
                fontSize: "13px",
                cursor: "pointer"
              }}
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* 🔮 POP-UP MODAL BERHASIL DISIMPAN */}
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
            <div style={{ fontSize: "52px", marginBottom: "12px" }}>📖✨</div>
            <h2 style={{ color: "#1b3b2b", margin: "0 0 10px 0", fontSize: "22px", fontWeight: "bold" }}>
              Jurnal Berhasil Disimpan!
            </h2>
            <p style={{ color: "#4b5563", fontSize: "14px", lineHeight: "1.5", marginBottom: "24px" }}>
              Catatan jurnalmu tersimpan rapi dan hanya bisa diakses oleh kamu.
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
                Tulis Lagi
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
      <footer style={{ backgroundColor: "#000", color: "#fff", textAlign: "center", padding: "40px 20px" }}>
        <p style={{ margin: "5px 0", fontSize: "14px" }}>Ruang Tenang - Tempat Berbagi Cerita</p>
        <p style={{ margin: "5px 0", fontSize: "14px" }}>Identitasmu aman. Semua curhat anonim</p>
        <p style={{ margin: "15px 0 0 0", fontSize: "14px" }}>© 2026 Ruang Tenang. Made With Z-solution</p>
      </footer>

    </div>
  );
}