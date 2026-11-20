import { existsSync } from 'node:fs';
import { join } from 'node:path';
import PDFDocument from 'pdfkit';

export type ParentCallPdfData = {
  namaSiswa: string;
  kelas: string;
  keperluan: string;
  tanggal: string;
  pukul: string;
  nomorSurat: string;
  namaGuruBK: string;
};

function formatTanggal(raw: string, withWeekday = false): string {
  const isoDate = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const date = isoDate
    ? new Date(Number(isoDate[1]), Number(isoDate[2]) - 1, Number(isoDate[3]), 12)
    : new Date(raw);
  if (Number.isNaN(date.getTime())) return raw || '-';
  return date.toLocaleDateString('id-ID', {
    timeZone: 'Asia/Jakarta',
    ...(withWeekday ? { weekday: 'long' } : {}),
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function writeField(
  doc: PDFKit.PDFDocument,
  label: string,
  value: string,
  x: number,
  y: number,
  labelWidth = 100,
) {
  doc.font('Times-Roman').fontSize(11).text(label, x, y, { width: labelWidth });
  doc.text(':', x + labelWidth, y, { width: 12 });
  doc.text(value || '-', x + labelWidth + 12, y, { width: 360 });
}

export function generateParentCallPdf(data: ParentCallPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 0,
      info: { Title: `Surat Panggilan Orang Tua - ${data.namaSiswa}` },
    });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const left = 68;
    const pageWidth = 595.28;
    const logoPath = join(process.cwd(), 'public', 'logo-smk.png');
    if (existsSync(logoPath)) {
      doc.image(logoPath, left, 42, { fit: [60, 68], align: 'center', valign: 'center' });
    }

    doc.font('Times-Bold').fontSize(10).text('PEMERINTAH PROVINSI JAWA BARAT', 142, 47, { width: 350, align: 'center' });
    doc.font('Times-Bold').fontSize(15).text('SMK BUDI BAKTI CIWIDEY', 142, 63, { width: 350, align: 'center' });
    doc.font('Times-Roman').fontSize(9).text('Jl. Babakantiga No. 82, Ciwidey, Kabupaten Bandung, Jawa Barat 40973', 142, 84, {
      width: 350,
      align: 'center',
    });

    doc.moveTo(left, 116).lineTo(pageWidth - left, 116).lineWidth(2).stroke();
    doc.moveTo(left, 120).lineTo(pageWidth - left, 120).lineWidth(0.7).stroke();
    doc.font('Times-Roman').fontSize(11).text(`Ciwidey, ${formatTanggal(new Date().toISOString())}`, 345, 143, {
      width: 180,
      align: 'right',
    });

    writeField(doc, 'Nomor', `421.5 / ${data.nomorSurat}-BK / SMK-BBC / ${new Date().getFullYear()}`, left, 178, 76);
    writeField(doc, 'Lampiran', '-', left, 195, 76);
    doc.font('Times-Roman').fontSize(11).text('Perihal', left, 212, { width: 76 });
    doc.text(':', left + 76, 212, { width: 12 });
    doc.font('Times-Bold').text('Panggilan Orang Tua / Wali Siswa', left + 88, 212, { underline: true, width: 340 });

    doc.font('Times-Roman').fontSize(11).text('Kepada Yth.', left, 253);
    doc.font('Times-Bold').text('Bapak/Ibu Orang Tua / Wali dari:', left, 270);
    writeField(doc, 'Nama Siswa', data.namaSiswa, left + 20, 292, 88);
    writeField(doc, 'Kelas', data.kelas, left + 20, 309, 88);
    doc.font('Times-Roman').text('di Tempat', left, 330);

    doc.font('Times-Roman').fontSize(11).text('Dengan hormat,', left, 366);
    doc.text(
      'Sehubungan dengan adanya hal penting yang berkaitan dengan pembinaan dan perkembangan kedisiplinan putra/putri Bapak/Ibu di sekolah, maka dengan ini kami mengharapkan kehadiran Bapak/Ibu Orang Tua/Wali siswa pada:',
      left,
      390,
      { width: pageWidth - left * 2, align: 'justify', lineGap: 3 },
    );

    const scheduleY = 449;
    writeField(doc, 'Hari / Tanggal', formatTanggal(data.tanggal, true), left + 24, scheduleY, 112);
    writeField(doc, 'Pukul', `${data.pukul || '09:00'} WIB s.d. selesai`, left + 24, scheduleY + 20, 112);
    writeField(doc, 'Tempat', 'Ruang Bimbingan Konseling (BK) SMK Budi Bakti Ciwidey', left + 24, scheduleY + 40, 112);
    writeField(doc, 'Keperluan', data.keperluan, left + 24, scheduleY + 60, 112);

    doc.font('Times-Roman').fontSize(11).text(
      'Mengingat pentingnya hal tersebut demi kebaikan dan kelancaran proses pendidikan putra/putri Bapak/Ibu, kami sangat mengharapkan kehadiran Bapak/Ibu tepat pada waktunya.',
      left,
      536,
      { width: pageWidth - left * 2, align: 'justify', lineGap: 3 },
    );
    doc.text(
      'Demikian surat panggilan ini kami sampaikan. Atas perhatian dan kerja sama Bapak/Ibu, kami ucapkan terima kasih.',
      left,
      584,
      { width: pageWidth - left * 2, align: 'justify', lineGap: 3 },
    );

    doc.font('Times-Roman').fontSize(10).text('Mengetahui,', left + 10, 640);
    doc.text('Wakasek Bidang Kesiswaan,', left + 10, 657);
    doc.text('_____________________________', left + 10, 727);
    doc.text('NIP. -', left + 10, 744);
    doc.text('Guru Bimbingan dan Konseling,', 330, 657);
    doc.text(data.namaGuruBK || '_____________________________', 330, 727, { underline: Boolean(data.namaGuruBK) });
    doc.text('NIP. -', 330, 744);
    doc.end();
  });
}
