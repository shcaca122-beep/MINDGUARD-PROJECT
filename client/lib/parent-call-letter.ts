import type { DatabaseRow } from '@/lib/database-row';

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function printParentCallLetter(item: DatabaseRow): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const name = escapeHtml(item.nama_siswa || item.nama);
  const kelas = escapeHtml(item.kelas || '-');
  const keperluan = escapeHtml(item.keperluan || item.alasan || '-');
  const tanggal = escapeHtml(item.tanggal || '-');
  const pukul = escapeHtml(item.pukul || '09:00');
  const nomor = escapeHtml(item.id || '-');
  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const year = new Date().getFullYear();

  printWindow.document.write(`
    <html>
      <head>
        <title>Surat Panggilan Orang Tua - ${name}</title>
        <style>
          body { font-family: 'Times New Roman', serif; margin: 40px; color: #000; line-height: 1.6; }
          .kop { display: flex; align-items: center; border-bottom: 3px double #000; padding-bottom: 12px; margin-bottom: 25px; }
          .logo { width: 75px; height: 75px; object-fit: contain; margin-right: 20px; }
          .instansi { text-align: center; width: 100%; }
          .instansi h2, .instansi h3, .instansi p { margin: 2px 0; }
          .content { margin-top: 20px; }
          .ttd-container { display: flex; justify-content: space-between; margin-top: 50px; }
          .ttd { text-align: center; width: 220px; }
          .btn-print { background: #047857; color: #fff; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; margin-bottom: 20px; }
          @media print { .btn-print { display: none; } }
        </style>
      </head>
      <body>
        <button class="btn-print" onclick="window.print()">Cetak / Simpan PDF Resmi</button>
        <div class="kop">
          <img src="/logo-smk.png" class="logo" alt="Logo SMK Budi Bakti" onerror="this.style.display='none'" />
          <div class="instansi">
            <h3 style="font-size: 14px;">YAYASAN PENDIDIKAN BUDI BAKTI</h3>
            <h2 style="font-size: 18px;">SMK BUDI BAKTI CIWIDEY</h2>
            <p style="font-size: 12px;">Terakreditasi A | Program Keahlian: BRP, DKV, RPL</p>
            <p style="font-size: 10.5px;">Jl. Babakan Tiga No. 99 Ciwidey - Kabupaten Bandung 40973</p>
          </div>
        </div>
        <div style="text-align: right; margin-bottom: 20px;">Ciwidey, ${today}</div>
        <div class="content">
          <p>Nomor: 421.5 / ${nomor} / BK-SMKBB / ${year}</p>
          <p>Lampiran: -</p>
          <p>Perihal: <strong>Undangan Orang Tua / Wali Siswa</strong></p>
          <br />
          <p>Kepada Yth.<br /><strong>Bapak/Ibu Orang Tua / Wali Siswa dari:</strong><br />
          Nama Siswa: <strong>${name} (${kelas})</strong><br />Di Tempat</p>
          <br />
          <p><em>Assalamu'alaikum Wr. Wb.</em></p>
          <p>Sehubungan dengan pembinaan kedisiplinan dan perkembangan siswa di sekolah, kami mengundang Bapak/Ibu untuk hadir guna melakukan koordinasi dan konsultasi bersama Guru Bimbingan Konseling (BK).</p>
          <p>Pertemuan tersebut akan dilaksanakan pada:</p>
          <table style="margin-left: 30px; margin-bottom: 15px;">
            <tr><td><strong>Hari / Tanggal</strong></td><td>: ${tanggal}</td></tr>
            <tr><td><strong>Pukul</strong></td><td>: ${pukul} WIB s.d. selesai</td></tr>
            <tr><td><strong>Tempat</strong></td><td>: Ruang Bimbingan Konseling (BK) SMK Budi Bakti Ciwidey</td></tr>
            <tr><td><strong>Keperluan</strong></td><td>: ${keperluan}</td></tr>
          </table>
          <p>Mengingat pentingnya acara ini demi kebaikan dan masa depan putra/putri Bapak/Ibu, kami mengharapkan kehadiran tepat pada waktunya.</p>
          <p>Demikian undangan resmi ini kami sampaikan. Atas perhatian dan kerja samanya, kami ucapkan terima kasih.</p>
          <p><em>Wassalamu'alaikum Wr. Wb.</em></p>
        </div>
        <div class="ttd-container">
          <div></div>
          <div class="ttd">
            <p>Mengetahui,<br />Guru Bimbingan Konseling,</p>
            <br /><br /><br />
            <p><strong>( Tim BK SMK Budi Bakti )</strong></p>
          </div>
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
}
