'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import BKUtilityBar from '../BKUtilityBar';
import { supabase } from '@/lib/supabase';
import type { DatabaseRow } from '@/lib/database-row';
import { formatErrorMessage } from '@/lib/error-utils';
import { showError, showSuccess } from '@/lib/swal';
import {
  PhoneCall,
  Plus,
  Printer,
  ClipboardList,
  Calendar,
  FileText,
  MessageCircle,
  Loader2,
  UserCheck,
} from 'lucide-react';

type ViolationRecord = {
  id?: string | number;
  nama_siswa?: string | null;
  nama?: string | null;
  kelas?: string | null;
  jenis_pelanggaran?: string | null;
  jenis?: string | null;
  poin?: number | null;
  created_at?: string | null;
  siswa_id?: string | null;
};

const STORAGE_BUCKET = 'surat-panggilan';

function formatTanggalIndonesia(raw: unknown, withWeekday = false): string {
  const str = String(raw || '').trim();
  if (!str) return '-';
  const parsed = new Date(str);
  if (Number.isNaN(parsed.getTime())) return str;
  return parsed.toLocaleDateString('id-ID', {
    ...(withWeekday ? { weekday: 'long' } : {}),
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function normalizeWhatsAppPhone(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('8')) return `62${digits}`;
  return digits;
}

function isMissingColumnError(error: unknown, columnName: string): boolean {
  if (!error || typeof error !== 'object') return false;
  const value = error as { code?: string; message?: string };
  const message = (value.message || '').toLowerCase();
  return (
    message.includes(columnName.toLowerCase()) &&
    (value.code === 'PGRST204' ||
      message.includes('column') ||
      message.includes('schema cache'))
  );
}

function sanitizePdfText(input: string): string {
  return input
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function wrapTextLines(text: string, maxChars: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return ['-'];
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if (!current) {
      current = word;
    } else if (current.length + 1 + word.length <= maxChars) {
      current += ` ${word}`;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function buildOfficialSummonPdfBlob(params: {
  nomorSurat: string;
  tanggalSurat: string;
  namaSiswa: string;
  kelas: string;
  hariTanggal: string;
  pukul: string;
  keperluan: string;
  namaGuruBK: string;
}): Blob {
  const commands: string[] = [];

  const drawText = (
    text: string,
    x: number,
    y: number,
    font: 'F1' | 'F2',
    size: number
  ) => {
    commands.push(
      `BT /${font} ${size} Tf 1 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)} Tm (${sanitizePdfText(text)}) Tj ET`
    );
  };

  const drawCenteredText = (
    text: string,
    y: number,
    font: 'F1' | 'F2',
    size: number
  ) => {
    const avgCharWidth = size * (font === 'F2' ? 0.52 : 0.48);
    const estimatedWidth = text.length * avgCharWidth;
    const x = Math.max(50, (595 - estimatedWidth) / 2);
    drawText(text, x, y, font, size);
  };

  const drawRightText = (
    text: string,
    rightX: number,
    y: number,
    font: 'F1' | 'F2',
    size: number
  ) => {
    const avgCharWidth = size * 0.48;
    const estimatedWidth = text.length * avgCharWidth;
    const x = Math.max(68, rightX - estimatedWidth);
    drawText(text, x, y, font, size);
  };

  const drawLine = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    width = 1
  ) => {
    commands.push(
      `${width.toFixed(2)} w ${x1.toFixed(1)} ${y1.toFixed(1)} m ${x2.toFixed(1)} ${y2.toFixed(1)} l S`
    );
  };

  // Kop Surat Resmi
  drawCenteredText('PEMERINTAH PROVINSI JAWA BARAT', 785, 'F2', 11.5);
  drawCenteredText('SMK BUDI BAKTI CIWIDEY', 767, 'F2', 15.5);
  drawCenteredText(
    'Jl. Babakantiga No. 82, Ciwidey, Kabupaten Bandung, Jawa Barat 40973',
    752,
    'F1',
    9.5
  );
  drawLine(68, 742, 527, 742, 2.0);
  drawLine(68, 738.5, 527, 738.5, 0.75);

  // Tanggal & Nomor Surat
  drawRightText(`Ciwidey, ${params.tanggalSurat}`, 527, 716, 'F1', 11.5);

  drawText('Nomor', 68, 692, 'F1', 11.5);
  drawText(':', 132, 692, 'F1', 11.5);
  drawText(params.nomorSurat, 144, 692, 'F1', 11.5);

  drawText('Lampiran', 68, 676, 'F1', 11.5);
  drawText(':', 132, 676, 'F1', 11.5);
  drawText('-', 144, 676, 'F1', 11.5);

  drawText('Perihal', 68, 660, 'F1', 11.5);
  drawText(':', 132, 660, 'F1', 11.5);
  drawText('Panggilan Orang Tua / Wali Siswa', 144, 660, 'F2', 11.5);
  drawLine(144, 658, 315, 658, 0.8);

  // Tujuan Surat
  drawText('Kepada Yth.', 68, 628, 'F1', 11.5);
  drawText('Bapak/Ibu Orang Tua / Wali dari:', 68, 612, 'F2', 11.5);

  drawText('Nama Siswa', 88, 594, 'F1', 11.5);
  drawText(':', 164, 594, 'F1', 11.5);
  drawText(params.namaSiswa, 176, 594, 'F2', 11.5);

  drawText('Kelas', 88, 578, 'F1', 11.5);
  drawText(':', 164, 578, 'F1', 11.5);
  drawText(params.kelas, 176, 578, 'F1', 11.5);

  drawText('di Tempat', 68, 560, 'F1', 11.5);

  // Isi Surat
  drawText('Dengan hormat,', 68, 534, 'F1', 11.5);

  const pembukaLines = wrapTextLines(
    'Sehubungan dengan adanya hal penting yang berkaitan dengan pembinaan dan perkembangan kedisiplinan putra/putri Bapak/Ibu di sekolah, maka dengan ini kami mengharapkan kehadiran Bapak/Ibu Orang Tua/Wali siswa pada:',
    80
  );
  let cursorY = 514;
  for (const line of pembukaLines) {
    drawText(line, 68, cursorY, 'F1', 11.5);
    cursorY -= 17;
  }

  cursorY -= 6;
  drawText('Hari / Tanggal', 88, cursorY, 'F1', 11.5);
  drawText(':', 174, cursorY, 'F1', 11.5);
  drawText(params.hariTanggal, 186, cursorY, 'F2', 11.5);

  cursorY -= 18;
  drawText('Pukul', 88, cursorY, 'F1', 11.5);
  drawText(':', 174, cursorY, 'F1', 11.5);
  drawText(`${params.pukul} WIB s.d. selesai`, 186, cursorY, 'F1', 11.5);

  cursorY -= 18;
  drawText('Tempat', 88, cursorY, 'F1', 11.5);
  drawText(':', 174, cursorY, 'F1', 11.5);
  drawText(
    'Ruang Bimbingan Konseling (BK) SMK Budi Bakti Ciwidey',
    186,
    cursorY,
    'F1',
    11.5
  );

  cursorY -= 18;
  drawText('Keperluan', 88, cursorY, 'F1', 11.5);
  drawText(':', 174, cursorY, 'F1', 11.5);
  const keperluanLines = wrapTextLines(params.keperluan, 56);
  for (let i = 0; i < keperluanLines.length; i += 1) {
    drawText(keperluanLines[i], 186, cursorY, 'F2', 11.5);
    if (i < keperluanLines.length - 1) cursorY -= 16;
  }

  cursorY -= 24;
  const penutup1 = wrapTextLines(
    'Mengingat pentingnya hal tersebut demi kebaikan dan kelancaran proses pendidikan putra/putri Bapak/Ibu, kami sangat mengharapkan kehadiran Bapak/Ibu tepat pada waktunya.',
    80
  );
  for (const line of penutup1) {
    drawText(line, 68, cursorY, 'F1', 11.5);
    cursorY -= 17;
  }

  cursorY -= 6;
  const penutup2 = wrapTextLines(
    'Demikian surat panggilan ini kami sampaikan. Atas perhatian dan kerja sama Bapak/Ibu, kami ucapkan terima kasih.',
    80
  );
  for (const line of penutup2) {
    drawText(line, 68, cursorY, 'F1', 11.5);
    cursorY -= 17;
  }

  // Blok Tanda Tangan
  cursorY -= 24;
  drawText('Mengetahui,', 82, cursorY, 'F1', 11.5);
  cursorY -= 16;
  drawText('Wakasek Bidang Kesiswaan,', 82, cursorY, 'F1', 11.5);
  drawText('Guru Bimbingan dan Konseling,', 335, cursorY, 'F1', 11.5);

  cursorY -= 56;
  drawText('_____________________________', 82, cursorY, 'F1', 11.5);
  const counselorLabel =
    params.namaGuruBK.trim() || '_____________________________';
  drawText(counselorLabel, 335, cursorY, 'F2', 11.5);
  if (params.namaGuruBK.trim()) {
    drawLine(
      335,
      cursorY - 2,
      Math.min(527, 335 + counselorLabel.length * 6),
      cursorY - 2,
      0.8
    );
  }

  cursorY -= 16;
  drawText('NIP. -', 82, cursorY, 'F1', 11.5);
  drawText('NIP. -', 335, cursorY, 'F1', 11.5);

  // Catatan kaki resmi
  drawLine(68, 62, 527, 62, 0.5);
  drawText(
    'Dokumen resmi diterbitkan melalui Sistem BK MindGuard - SMK Budi Bakti Ciwidey',
    68,
    48,
    'F1',
    8.5
  );

  const streamContent = commands.join('\n');
  const encoder = new TextEncoder();
  const streamByteLength = encoder.encode(streamContent).length;

  const objects: string[] = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman /Encoding /WinAnsiEncoding >>\nendobj\n',
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold /Encoding /WinAnsiEncoding >>\nendobj\n',
    `6 0 obj\n<< /Length ${streamByteLength} >>\nstream\n${streamContent}\nendstream\nendobj\n`,
  ];

  const header = '%PDF-1.4\n';
  const offsets: number[] = [0];
  let currentOffset = encoder.encode(header).length;

  for (const obj of objects) {
    offsets.push(currentOffset);
    currentOffset += encoder.encode(obj).length;
  }

  const xrefStart = currentOffset;
  const xrefLines = [
    'xref',
    `0 ${objects.length + 1}`,
    '0000000000 65535 f ',
    ...offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n `),
  ];
  const trailer = `${xrefLines.join('\n')}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  const fullPdfString = header + objects.join('') + trailer;
  return new Blob([encoder.encode(fullPdfString)], { type: 'application/pdf' });
}

export default function PanggilanOrtuPage() {
  const router = useRouter();
  const [dataPanggilan, setDataPanggilan] = useState<DatabaseRow[]>([]);
  const [dataPelanggaran, setDataPelanggaran] = useState<ViolationRecord[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [namaSiswa, setNamaSiswa] = useState('');
  const [kelas, setKelas] = useState('');
  const [selectedPelanggaran, setSelectedPelanggaran] = useState('');
  const [keperluan, setKeperluan] = useState('Konsultasi Pelanggaran & Pembinaan Siswa');
  const [tanggalPanggilan, setTanggalPanggilan] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [pukul, setPukul] = useState('09:00');
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [printItem, setPrintItem] = useState<DatabaseRow | null>(null);
  const [namaGuruBK, setNamaGuruBK] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [loadingParentPhone, setLoadingParentPhone] = useState(false);
  const [sendingCallId, setSendingCallId] = useState<string | null>(null);
  const [parentPhoneByCallId, setParentPhoneByCallId] = useState<Record<string, string>>({});
  const parentPhonesByCallId = useRef(new Map<string, string>());

  const fetchPanggilan = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('panggilan_ortu').select('*');

      if (error) throw error;
      if (data) {
        const normalized = data.map((row: Record<string, unknown>) => ({
          ...row,
          nama_siswa:
            typeof row.nama_siswa === 'string'
              ? row.nama_siswa
              : typeof row.nama === 'string'
                ? row.nama
                : '',
          kelas: typeof row.kelas === 'string' ? row.kelas : '',
          keperluan:
            typeof row.keperluan === 'string'
              ? row.keperluan
              : typeof row.alasan === 'string'
                ? row.alasan
                : String(row.keperluan ?? row.alasan ?? ''),
          tanggal: typeof row.tanggal === 'string' ? row.tanggal : '',
          pukul: typeof row.pukul === 'string' ? row.pukul : '09:00',
          parent_phone:
            typeof row.parent_phone === 'string'
              ? row.parent_phone
              : parentPhonesByCallId.current.get(String(row.id)) || '',
        })) as DatabaseRow[];
        setDataPanggilan(
          normalized.sort((a, b) =>
            String(b.created_at || '').localeCompare(String(a.created_at || ''))
          ) as DatabaseRow[]
        );
      }
    } catch (err) {
      console.error('Gagal mengambil data panggilan:', err);
      showError('Arsip panggilan gagal dimuat', formatErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchPelanggaran = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('pelanggaran_siswa')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDataPelanggaran((data || []) as ViolationRecord[]);
    } catch (error: unknown) {
      console.error('Gagal memuat data pelanggaran untuk surat panggilan:', error);
      showError('Data pelanggaran tidak dapat dimuat', formatErrorMessage(error));
    }
  }, []);

  const handlePilihPelanggaran = async (id: string) => {
    setSelectedPelanggaran(id);
    const violation = dataPelanggaran.find((item) => String(item.id) === id);
    setParentPhone('');
    if (!violation) return;

    const name = violation.nama_siswa || violation.nama || '';
    const violationName = violation.jenis_pelanggaran || violation.jenis || '';
    const points = violation.poin == null ? '' : ` (Poin: ${violation.poin})`;
    setNamaSiswa(name);
    setKelas(violation.kelas || '');
    setKeperluan(
      violationName
        ? `Pemanggilan terkait: ${violationName}${points}`
        : 'Konsultasi Pelanggaran & Pembinaan Siswa'
    );

    if (!violation.siswa_id) return;
    setLoadingParentPhone(true);
    try {
      const { data, error } = await supabase.rpc('get_student_parent_phone', {
        p_student_id: violation.siswa_id,
      });
      if (error) throw error;
      setParentPhone(typeof data === 'string' ? data : '');
    } catch (error) {
      console.error('Gagal mengambil nomor orang tua untuk surat panggilan:', error);
      showError('Nomor orang tua tidak dapat dimuat', formatErrorMessage(error));
    } finally {
      setLoadingParentPhone(false);
    }
  };

  const normalizedSearch = searchText.trim().toLowerCase();
  const filteredPanggilan = dataPanggilan.filter((item) =>
    [item.nama_siswa, item.kelas, item.keperluan, item.tanggal, item.pukul].some((value) =>
      String(value || '')
        .toLowerCase()
        .includes(normalizedSearch)
    )
  );

  const handleGuruBKChange = (value: string) => {
    setNamaGuruBK(value);
    const trimmed = value.trim();
    if (trimmed) {
      localStorage.setItem('bk_custom_name', trimmed);
    } else {
      localStorage.removeItem('bk_custom_name');
    }
  };

  const handleSimpanPanggilan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaSiswa || !kelas) {
      showError('Data belum lengkap', 'Mohon isi nama siswa dan kelas terlebih dahulu.');
      return;
    }

    const safeKelas = kelas.trim() || 'Tidak Diketahui';
    const safeNama = namaSiswa.trim() || 'Tidak Diketahui';
    const safeKeperluan = keperluan.trim() || 'Konsultasi Pelanggaran & Pembinaan Siswa';

    try {
      const payloadCandidates: Array<Record<string, string>> = [
        {
          nama_siswa: safeNama,
          ortu: 'Orang Tua',
          kelas: safeKelas,
          keperluan: safeKeperluan,
          parent_phone: parentPhone.trim(),
          tanggal: tanggalPanggilan,
          pukul,
        },
        {
          nama_siswa: safeNama,
          ortu: 'Orang Tua',
          kelas: safeKelas,
          alasan: safeKeperluan,
          parent_phone: parentPhone.trim(),
          tanggal: tanggalPanggilan,
          pukul,
        },
        {
          nama: safeNama,
          ortu: 'Orang Tua',
          kelas: safeKelas,
          alasan: safeKeperluan,
          parent_phone: parentPhone.trim(),
          tanggal: tanggalPanggilan,
          pukul,
        },
        {
          nama: safeNama,
          ortu: 'Orang Tua',
          kelas: safeKelas,
          keperluan: safeKeperluan,
          parent_phone: parentPhone.trim(),
          tanggal: tanggalPanggilan,
          pukul,
        },
      ];

      let lastError: unknown = null;
      let savedWithoutParentPhone = false;
      let insertedCall: DatabaseRow | null = null;
      for (const payload of payloadCandidates) {
        const { data, error } = await supabase
          .from('panggilan_ortu')
          .insert([payload])
          .select('*')
          .single();
        if (!error) {
          insertedCall = data as DatabaseRow;
          break;
        }
        lastError = error;
        if (isMissingColumnError(error, 'parent_phone')) {
          savedWithoutParentPhone = true;
          break;
        }
      }

      if (savedWithoutParentPhone) {
        for (const payload of payloadCandidates) {
          const compatiblePayload = Object.fromEntries(
            Object.entries(payload).filter(([key]) => key !== 'parent_phone')
          );
          const { data, error } = await supabase
            .from('panggilan_ortu')
            .insert([compatiblePayload])
            .select('*')
            .single();
          if (!error) {
            insertedCall = data as DatabaseRow;
            break;
          }
          lastError = error;
        }
      }

      if (insertedCall) {
        if (savedWithoutParentPhone && parentPhone.trim() && insertedCall.id != null) {
          parentPhonesByCallId.current.set(String(insertedCall.id), parentPhone.trim());
        }
        showSuccess(
          'Surat berhasil dibuat',
          'Surat panggilan orang tua berhasil disimpan dan siap dikirim via WhatsApp.'
        );
        setShowModal(false);
        setNamaSiswa('');
        setKelas('');
        setSelectedPelanggaran('');
        setParentPhone('');
        void fetchPanggilan();
        return;
      }

      throw lastError ?? new Error('Gagal menyimpan surat panggilan orang tua.');
    } catch (error: unknown) {
      console.error('Gagal menyimpan surat panggilan orang tua:', error);
      showError('Gagal menyimpan surat', formatErrorMessage(error));
    }
  };

  const getNomorUrutSurat = useCallback(
    (targetItem: DatabaseRow | null) => {
      if (!targetItem) return '001';
      const chronological = [...dataPanggilan].reverse();
      const foundIndex = chronological.findIndex(
        (row) => String(row.id) === String(targetItem.id)
      );
      const urutan = foundIndex >= 0 ? foundIndex + 1 : 1;
      return String(urutan).padStart(3, '0');
    },
    [dataPanggilan]
  );

  const handleCetakPDF = (item: DatabaseRow) => {
    setPrintItem(item);
    const originalTitle = document.title;
    const cleanName = String(item.nama_siswa || 'Siswa').replace(/\s+/g, '_');
    window.addEventListener(
      'afterprint',
      () => {
        document.title = originalTitle;
      },
      { once: true }
    );

    setTimeout(() => {
      document.title = `Surat_Panggilan_Ortu_${cleanName}`;
      window.print();
    }, 120);
  };

  const handleSendPdfWhatsApp = async (item: DatabaseRow, rawPhone: string) => {
    if (item.id == null) {
      showError('Surat belum tersimpan', 'ID surat panggilan tidak tersedia.');
      return;
    }

    const normalizedPhone = normalizeWhatsAppPhone(rawPhone);
    if (!normalizedPhone || normalizedPhone.length < 10) {
      showError(
        'Nomor WhatsApp tidak valid',
        'Masukkan nomor WhatsApp orang tua/wali yang benar (contoh: 081234567890).'
      );
      return;
    }

    const callId = String(item.id);
    const activeCounselor = namaGuruBK.trim() || 'Guru BK SMK Budi Bakti Ciwidey';
    const studentName = String(item.nama_siswa || 'Siswa');
    const studentClass = String(item.kelas || '-');
    const reasonText = String(item.keperluan || 'Konsultasi Pembinaan Siswa');
    const scheduleDate = formatTanggalIndonesia(item.tanggal, true);
    const scheduleTime = String(item.pukul || '09:00');
    const letterNumber = `421.5 / ${getNomorUrutSurat(item)}-BK / SMK-BBC / ${new Date().getFullYear()}`;
    const letterDate = formatTanggalIndonesia(new Date().toISOString(), false);

    setSendingCallId(callId);
    try {
      // 1. Simpan nomor telepon wali ke cache lokal & database jika kolom tersedia
      parentPhonesByCallId.current.set(callId, rawPhone.trim());
      await supabase
        .from('panggilan_ortu')
        .update({ parent_phone: rawPhone.trim() })
        .eq('id', item.id)
        .then(({ error }) => {
          if (error && !isMissingColumnError(error, 'parent_phone')) {
            console.warn('Pembaruan nomor wali di database dilewati:', error.message);
          }
        });

      // 2. Buat file PDF resmi berkop sekolah
      const pdfBlob = buildOfficialSummonPdfBlob({
        nomorSurat: letterNumber,
        tanggalSurat: letterDate,
        namaSiswa: studentName,
        kelas: studentClass,
        hariTanggal: scheduleDate,
        pukul: scheduleTime,
        keperluan: reasonText,
        namaGuruBK: namaGuruBK.trim(),
      });

      const safeFileStudent = studentName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      const filePath = `surat-panggilan-${safeFileStudent || 'siswa'}-${callId}-${Date.now()}.pdf`;

      // 3. Unggah PDF ke bucket Supabase Storage 'surat-panggilan'
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (uploadError) {
        throw new Error(
          `Gagal mengunggah PDF ke penyimpanan (${uploadError.message}). Pastikan bucket "${STORAGE_BUCKET}" bersifat Public dan memiliki policy INSERT.`
        );
      }

      const { data: publicUrlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);
      const pdfPublicUrl = publicUrlData.publicUrl;

      // 4. Susun pesan resmi dari nomor WhatsApp guru BK yang sedang jaga
      const whatsappMessage = [
        "Assalamu'alaikum Wr. Wb.",
        '',
        'Yth. Bapak/Ibu Orang Tua/Wali dari:',
        `• Nama Siswa : *${studentName}*`,
        `• Kelas : *${studentClass}*`,
        '',
        'Dengan hormat, kami dari Bimbingan Konseling (BK) *SMK Budi Bakti Ciwidey* mengundang kehadiran Bapak/Ibu ke sekolah pada:',
        `• Hari/Tanggal : *${scheduleDate}*`,
        `• Pukul : *${scheduleTime} WIB s.d. selesai*`,
        '• Tempat : *Ruang BK SMK Budi Bakti Ciwidey*',
        `• Keperluan : *${reasonText}*`,
        '',
        'Berikut tautan *Surat Panggilan Resmi (PDF)* yang dapat Bapak/Ibu unduh:',
        pdfPublicUrl,
        '',
        'Atas perhatian dan kerja sama Bapak/Ibu, kami ucapkan terima kasih.',
        '',
        'Hormat kami,',
        `*${activeCounselor}*`,
        'Bimbingan Konseling SMK Budi Bakti Ciwidey',
      ].join('\n');

      const waUrl = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(whatsappMessage)}`;

      // 5. Buka WhatsApp di perangkat/browser guru BK yang sedang aktif
      const openedWindow = window.open(waUrl, '_blank', 'noopener,noreferrer');
      if (!openedWindow) {
        window.location.assign(waUrl);
      }

      showSuccess(
        'Surat PDF siap dikirim',
        'PDF surat panggilan telah terunggah dan WhatsApp dibuka dengan pesan & tautan surat resmi.'
      );
    } catch (error) {
      console.error('Gagal menyiapkan pengiriman PDF via WhatsApp:', error);
      showError(
        'Gagal mengirim via WhatsApp',
        error instanceof Error ? error.message : 'Terjadi kesalahan saat menyiapkan surat PDF.'
      );
    } finally {
      setSendingCallId(null);
    }
  };

  useEffect(() => {
    const session =
      localStorage.getItem('user_session') || localStorage.getItem('admin_session');
    if (!session) {
      router.push('/');
      return;
    }

    const savedBKName = localStorage.getItem('bk_custom_name') || '';
    if (savedBKName && savedBKName.toLowerCase() !== 'umum') {
      queueMicrotask(() => setNamaGuruBK(savedBKName));
    } else {
      try {
        const parsed = JSON.parse(session) as Record<string, unknown>;
        const sessionName = String(
          parsed.nama_guru || parsed.nama || parsed.full_name || parsed.name || ''
        ).trim();
        if (
          sessionName &&
          sessionName.toLowerCase() !== 'umum' &&
          sessionName.toLowerCase() !== 'bk'
        ) {
          queueMicrotask(() => setNamaGuruBK(sessionName));
        }
      } catch {
        // Abaikan jika session bukan string JSON
      }
    }

    queueMicrotask(() => {
      void fetchPanggilan();
      void fetchPelanggaran();
    });
  }, [fetchPanggilan, fetchPelanggaran, router]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paramNama = params.get('nama');
    const paramKelas = params.get('kelas');
    const paramKeperluan = params.get('keperluan');
    const paramPelanggaranId = params.get('pelanggaran_id');
    const paramSiswaId = params.get('siswa_id');

    if (!paramNama && !paramPelanggaranId) return;

    window.history.replaceState({}, document.title, window.location.pathname);

    queueMicrotask(() => {
      if (paramPelanggaranId) setSelectedPelanggaran(paramPelanggaranId);
      if (paramNama) setNamaSiswa(paramNama);
      if (paramKelas) setKelas(paramKelas);
      if (paramKeperluan) setKeperluan(paramKeperluan);
      setShowModal(true);

      if (paramSiswaId) {
        void (async () => {
          setLoadingParentPhone(true);
          try {
            const { data, error } = await supabase.rpc('get_student_parent_phone', {
              p_student_id: paramSiswaId,
            });
            if (!error && typeof data === 'string') {
              setParentPhone(data);
            }
          } finally {
            setLoadingParentPhone(false);
          }
        })();
      }
    });
  }, []);

  const nomorUrutSurat = useMemo(
    () => getNomorUrutSurat(printItem),
    [getNomorUrutSurat, printItem]
  );

  const tanggalSuratHariIni = formatTanggalIndonesia(new Date().toISOString(), false);
  const tahunSurat = new Date().getFullYear();

  return (
    <>
      <style>{`
        .official-print-sheet {
          display: none;
        }

        @page {
          size: A4 portrait;
          margin: 0;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 0 !important;
          }

          html,
          body,
          html body > div {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            height: auto !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            background: #ffffff !important;
            background-color: #ffffff !important;
            background-image: none !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .bk-panel-page,
          [class*="mindy"],
          [class*="Mindy"],
          [style*="position: fixed"] {
            display: none !important;
          }

          html body .official-print-sheet {
            display: block !important;
            width: 210mm !important;
            max-width: 100% !important;
            height: auto !important;
            margin: 0 auto !important;
            padding: 20mm 24mm 18mm 24mm !important;
            box-sizing: border-box !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: "Times New Roman", Times, Georgia, serif !important;
            font-size: 12pt !important;
            line-height: 1.5 !important;
          }

          html body .official-print-sheet * {
            color: #000000 !important;
            -webkit-text-fill-color: #000000 !important;
            background: transparent !important;
            box-shadow: none !important;
            text-shadow: none !important;
            box-sizing: border-box !important;
          }

          .surat-kop {
            display: grid !important;
            grid-template-columns: 68px 1fr 68px;
            align-items: center;
            gap: 10px;
            padding: 0 2px 10px 2px !important;
            margin-bottom: 16px !important;
            border-bottom: 3px double #000000 !important;
            text-align: center;
          }

          .surat-kop-logo {
            width: 64px !important;
            height: 64px !important;
            object-fit: contain;
          }

          .surat-kop-prov {
            margin: 0 !important;
            font-size: 11pt !important;
            font-weight: 700 !important;
            letter-spacing: 0.4px;
            line-height: 1.25 !important;
          }

          .surat-kop-sekolah {
            margin: 2px 0 !important;
            font-size: 15.5pt !important;
            font-weight: 800 !important;
            line-height: 1.2 !important;
          }

          .surat-kop-alamat {
            margin: 0 !important;
            font-size: 9.5pt !important;
            line-height: 1.3 !important;
          }

          .surat-tanggal-kanan {
            text-align: right;
            margin: 0 0 14px 0 !important;
          }

          .surat-meta-table {
            border-collapse: collapse;
            margin-bottom: 18px !important;
          }

          .surat-meta-table td {
            padding: 1.5px 4px 1.5px 0 !important;
            vertical-align: top;
          }

          .surat-tujuan {
            margin-bottom: 18px !important;
          }

          .surat-tujuan p {
            margin: 0 !important;
          }

          .surat-siswa-table {
            border-collapse: collapse;
            margin: 4px 0 4px 20px !important;
          }

          .surat-siswa-table td {
            padding: 1.5px 6px 1.5px 0 !important;
            vertical-align: top;
          }

          .surat-paragraf {
            margin: 0 0 12px 0 !important;
            text-align: justify;
            overflow-wrap: break-word;
            word-wrap: break-word;
          }

          .surat-jadwal-table {
            border-collapse: collapse;
            margin: 8px 0 16px 24px !important;
            width: calc(100% - 24px) !important;
          }

          .surat-jadwal-table td {
            padding: 3.5px 6px 3.5px 0 !important;
            vertical-align: top;
          }

          .surat-ttd-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr;
            gap: 32px;
            margin-top: 34px !important;
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .surat-ttd-kolom {
            text-align: left;
            padding-left: 14px !important;
          }

          .surat-ttd-kolom p {
            margin: 0 !important;
            line-height: 1.4 !important;
          }

          .surat-ttd-ruang {
            height: 66px !important;
          }
        }
      `}</style>

      {/* LEMBAR CETAK SURAT RESMI (Hanya tampil saat dicetak / Print PDF) */}
      <div className="official-print-sheet">
        <div className="surat-kop">
          <img
            src="/logo-smk.png"
            alt="Logo SMK Budi Bakti Ciwidey"
            className="surat-kop-logo"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div>
            <p className="surat-kop-prov">PEMERINTAH PROVINSI JAWA BARAT</p>
            <h1 className="surat-kop-sekolah">SMK BUDI BAKTI CIWIDEY</h1>
            <p className="surat-kop-alamat">
              Jl. Babakantiga No. 82, Ciwidey, Kabupaten Bandung, Jawa Barat 40973
            </p>
          </div>
          <span aria-hidden="true" />
        </div>

        <p className="surat-tanggal-kanan">Ciwidey, {tanggalSuratHariIni}</p>

        <table className="surat-meta-table">
          <tbody>
            <tr>
              <td style={{ width: '82px' }}>Nomor</td>
              <td style={{ width: '14px' }}>:</td>
              <td>
                421.5 / {nomorUrutSurat}-BK / SMK-BBC / {tahunSurat}
              </td>
            </tr>
            <tr>
              <td>Lampiran</td>
              <td>:</td>
              <td>-</td>
            </tr>
            <tr>
              <td>Perihal</td>
              <td>:</td>
              <td style={{ fontWeight: 700, textDecoration: 'underline' }}>
                Panggilan Orang Tua / Wali Siswa
              </td>
            </tr>
          </tbody>
        </table>

        <div className="surat-tujuan">
          <p>Kepada Yth.</p>
          <p style={{ fontWeight: 700 }}>Bapak/Ibu Orang Tua / Wali dari:</p>
          <table className="surat-siswa-table">
            <tbody>
              <tr>
                <td style={{ width: '100px' }}>Nama Siswa</td>
                <td style={{ width: '14px' }}>:</td>
                <td style={{ fontWeight: 700 }}>{String(printItem?.nama_siswa || '-')}</td>
              </tr>
              <tr>
                <td>Kelas</td>
                <td>:</td>
                <td>{String(printItem?.kelas || '-')}</td>
              </tr>
            </tbody>
          </table>
          <p>di Tempat</p>
        </div>

        <p className="surat-paragraf">Dengan hormat,</p>

        <p className="surat-paragraf">
          Sehubungan dengan adanya hal penting yang berkaitan dengan pembinaan dan perkembangan
          kedisiplinan putra/putri Bapak/Ibu di sekolah, maka dengan ini kami mengharapkan kehadiran
          Bapak/Ibu Orang Tua/Wali siswa pada:
        </p>

        <table className="surat-jadwal-table">
          <tbody>
            <tr>
              <td style={{ width: '120px' }}>Hari / Tanggal</td>
              <td style={{ width: '14px' }}>:</td>
              <td style={{ fontWeight: 700 }}>
                {formatTanggalIndonesia(printItem?.tanggal, true)}
              </td>
            </tr>
            <tr>
              <td>Pukul</td>
              <td>:</td>
              <td>{String(printItem?.pukul || '09:00')} WIB s.d. selesai</td>
            </tr>
            <tr>
              <td>Tempat</td>
              <td>:</td>
              <td>Ruang Bimbingan Konseling (BK) SMK Budi Bakti Ciwidey</td>
            </tr>
            <tr>
              <td>Keperluan</td>
              <td>:</td>
              <td style={{ fontWeight: 700 }}>{String(printItem?.keperluan || '-')}</td>
            </tr>
          </tbody>
        </table>

        <p className="surat-paragraf">
          Mengingat pentingnya hal tersebut demi kebaikan dan kelancaran proses pendidikan
          putra/putri Bapak/Ibu, kami sangat mengharapkan kehadiran Bapak/Ibu tepat pada waktunya.
        </p>

        <p className="surat-paragraf">
          Demikian surat panggilan ini kami sampaikan. Atas perhatian dan kerja sama Bapak/Ibu,
          kami ucapkan terima kasih.
        </p>

        <div className="surat-ttd-grid">
          <div className="surat-ttd-kolom">
            <p>Mengetahui,</p>
            <p>Wakasek Bidang Kesiswaan,</p>
            <div className="surat-ttd-ruang" />
            <p style={{ fontWeight: 700 }}>_____________________________</p>
            <p>NIP. -</p>
          </div>
          <div className="surat-ttd-kolom">
            <p>&nbsp;</p>
            <p>Guru Bimbingan dan Konseling,</p>
            <div className="surat-ttd-ruang" />
            <p style={{ fontWeight: 700, textDecoration: namaGuruBK ? 'underline' : 'none' }}>
              {namaGuruBK || '_____________________________'}
            </p>
            <p>NIP. -</p>
          </div>
        </div>
      </div>

      {/* TAMPILAN DASHBOARD PANEL BK (Hanya tampil di layar) */}
      <div
        className="bk-panel-page"
        style={{
          display: 'flex',
          minHeight: '100vh',
          width: '100%',
          background:
            'linear-gradient(135deg, #021f18 0%, #032c22 35%, #054233 70%, #064e3b 100%)',
          fontFamily: 'system-ui, sans-serif',
          boxSizing: 'border-box',
        }}
      >
        <div
          className="bk-panel-sidebar"
          style={{
            background: '#021f18',
            borderRight: '1px solid rgba(52, 211, 153, 0.15)',
            flexShrink: 0,
          }}
        >
          <Sidebar />
        </div>
        <div
          className="bk-panel-main"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            overflowY: 'auto',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <BKUtilityBar
            currentRoute="Panggilan Orang Tua"
            searchValue={searchText}
            searchPlaceholder="Cari siswa, kelas, keperluan, atau jadwal..."
            onSearchChange={setSearchText}
            onRefresh={fetchPanggilan}
            isRefreshing={isLoading}
          />

          {/* TOP BAR */}
          <div
            className="bk-route-heading"
            style={{
              background: 'linear-gradient(135deg, #021f18 0%, #064e3b 100%)',
              color: '#ffffff',
              padding: '18px 30px',
              borderBottom: '1px solid rgba(52, 211, 153, 0.25)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  backgroundColor: 'rgba(52, 211, 153, 0.15)',
                  padding: 8,
                  borderRadius: 10,
                  border: '1px solid rgba(52,211,153,0.3)',
                }}
              >
                <PhoneCall size={24} color="#34d399" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>
                  Surat & Log Panggilan Orang Tua
                </h2>
                <span style={{ fontSize: '12px', color: '#a7f3d0' }}>
                  SMK Budi Bakti Ciwidey • Sinkronisasi Database Real-time
                </span>
              </div>
            </div>
          </div>

          {/* KONTEN UTAMA */}
          <div
            className="bk-panel-content"
            style={{
              padding: '30px',
              flex: 1,
              maxWidth: '1400px',
              width: '100%',
              margin: '0 auto',
              boxSizing: 'border-box',
            }}
          >
            {/* INFO, IDENTITAS GURU BK BERTUGAS & TOMBOL AKSI */}
            <div
              style={{
                backgroundColor: 'rgba(2, 31, 24, 0.92)',
                backdropFilter: 'blur(16px)',
                borderRadius: '18px',
                padding: '26px 30px',
                marginBottom: '28px',
                border: '1.5px solid rgba(52, 211, 153, 0.35)',
                boxShadow: '0 10px 35px rgba(0,0,0,0.4)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '20px',
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ flex: '1 1 340px' }}>
                <h3
                  style={{
                    margin: '0 0 5px 0',
                    color: '#ecfdf5',
                    fontSize: '16.5px',
                    fontWeight: '800',
                  }}
                >
                  Penerbitan Surat Resmi Orang Tua / Wali Siswa
                </h3>
                <p style={{ margin: '0 0 12px 0', color: '#94a3b8', fontSize: '12.5px' }}>
                  Surat PDF otomatis tersimpan di arsip cloud dan langsung siap dikirim lewat
                  WhatsApp guru BK yang sedang jaga.
                </p>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#a7f3d0',
                    }}
                  >
                    <UserCheck size={15} /> Guru BK Bertugas:
                  </span>
                  <input
                    type="text"
                    value={namaGuruBK}
                    onChange={(e) => handleGuruBKChange(e.target.value)}
                    placeholder="Isi nama guru BK jaga (misal: Ibu Siti, S.Pd.)"
                    style={{
                      padding: '7px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(52, 211, 153, 0.35)',
                      background: '#064e3b',
                      color: '#ffffff',
                      fontSize: '12.5px',
                      minWidth: '240px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
              <button
                onClick={() => setShowModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: '#fff',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '10px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 15px rgba(5, 150, 105, 0.4)',
                }}
              >
                <Plus size={16} /> Buat Surat Panggilan Ortu
              </button>
            </div>

            {/* GRID DATA */}
            <div
              className="bk-record-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                gap: '20px',
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              {filteredPanggilan.length === 0 ? (
                <div
                  style={{
                    gridColumn: '1 / -1',
                    textAlign: 'center',
                    padding: '40px',
                    color: '#94a3b8',
                    background: 'rgba(2,31,24,0.6)',
                    borderRadius: '16px',
                    border: '1px solid rgba(52,211,153,0.2)',
                  }}
                >
                  <ClipboardList
                    size={38}
                    color="#34d399"
                    style={{ marginBottom: '10px', opacity: 0.8 }}
                  />
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
                    {dataPanggilan.length > 0
                      ? 'Tidak ada panggilan orang tua yang cocok dengan pencarian.'
                      : 'Belum ada surat panggilan orang tua yang diterbitkan.'}
                  </p>
                </div>
              ) : (
                filteredPanggilan.map((item) => {
                  const currentPhoneValue =
                    parentPhoneByCallId[String(item.id)] ??
                    (typeof item.parent_phone === 'string' ? item.parent_phone : '');

                  return (
                    <div
                      key={item.id}
                      style={{
                        backgroundColor: 'rgba(2, 31, 24, 0.88)',
                        padding: '22px',
                        borderRadius: '16px',
                        border: '1px solid rgba(52, 211, 153, 0.25)',
                        borderLeft: '4px solid #f87171',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
                        boxSizing: 'border-box',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '10px',
                        }}
                      >
                        <strong style={{ color: '#f8fafc', fontSize: '15.5px', fontWeight: '800' }}>
                          {item.nama_siswa}
                        </strong>
                        <span
                          style={{
                            backgroundColor: '#451a03',
                            color: '#f87171',
                            padding: '3px 10px',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            fontWeight: 'bold',
                            border: '1px solid rgba(248,113,113,0.3)',
                          }}
                        >
                          {item.kelas}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: '12.5px',
                          color: '#94a3b8',
                          marginBottom: '8px',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '6px',
                        }}
                      >
                        <FileText size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>
                          <strong>Keperluan:</strong> {item.keperluan}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: '12.5px',
                          color: '#38bdf8',
                          marginBottom: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <Calendar size={14} style={{ flexShrink: 0 }} />
                        <span>
                          <strong>Jadwal:</strong> {item.tanggal} Pukul {item.pukul} WIB
                        </span>
                      </div>
                      <button
                        onClick={() => handleCetakPDF(item)}
                        style={{
                          width: '100%',
                          backgroundColor: '#064e3b',
                          color: '#a7f3d0',
                          border: '1px solid rgba(52,211,153,0.3)',
                          padding: '11px',
                          borderRadius: '10px',
                          fontWeight: 'bold',
                          fontSize: '13px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          transition: 'all 0.2s',
                          boxSizing: 'border-box',
                        }}
                      >
                        <Printer size={16} /> Cetak Surat PDF Resmi
                      </button>
                      <label
                        className="mb-2 mt-3 block text-xs font-semibold text-emerald-200"
                        htmlFor={`parent-phone-${item.id}`}
                      >
                        Nomor WhatsApp orang tua / wali
                      </label>
                      <input
                        id={`parent-phone-${item.id}`}
                        type="tel"
                        value={currentPhoneValue}
                        onChange={(event) =>
                          setParentPhoneByCallId((current) => ({
                            ...current,
                            [String(item.id)]: event.target.value,
                          }))
                        }
                        placeholder="Contoh: 081234567890"
                        className="mb-2 w-full rounded-lg border border-emerald-800 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500"
                      />
                      <button
                        type="button"
                        onClick={() => void handleSendPdfWhatsApp(item, currentPhoneValue)}
                        disabled={sendingCallId !== null || !currentPhoneValue.trim()}
                        className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-600 bg-emerald-900/50 px-3 py-2 text-sm font-bold text-emerald-200 hover:bg-emerald-800/70 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {sendingCallId === String(item.id) ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <MessageCircle size={16} />
                        )}
                        {sendingCallId === String(item.id)
                          ? 'Menyiapkan PDF & WhatsApp...'
                          : 'Kirim Surat PDF via WhatsApp BK'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* MODAL INPUT */}
          {showModal && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: 'rgba(0,0,0,0.8)',
                backdropFilter: 'blur(5px)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1000,
                padding: '15px',
                boxSizing: 'border-box',
              }}
            >
              <div
                style={{
                  backgroundColor: '#021f18',
                  padding: '30px',
                  borderRadius: '18px',
                  maxWidth: '460px',
                  width: '100%',
                  border: '1.5px solid rgba(52, 211, 153, 0.4)',
                  boxShadow: '0 15px 40px rgba(0,0,0,0.6)',
                  boxSizing: 'border-box',
                }}
              >
                <h3
                  style={{
                    color: '#ffffff',
                    margin: '0 0 16px 0',
                    fontSize: '18px',
                    fontWeight: '800',
                  }}
                >
                  Buat Surat Panggilan Orang Tua
                </h3>
                <form
                  onSubmit={handleSimpanPanggilan}
                  style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
                >
                  <div>
                    <label
                      style={{
                        fontSize: '12px',
                        color: '#cbd5e1',
                        fontWeight: '700',
                        display: 'block',
                        marginBottom: '5px',
                      }}
                    >
                      Ambil data dari pelanggaran siswa (opsional)
                    </label>
                    <select
                      value={selectedPelanggaran}
                      onChange={(e) => handlePilihPelanggaran(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '10px',
                        background: '#064e3b',
                        color: '#fff',
                        border: '1px solid rgba(52,211,153,0.3)',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                    >
                      <option value="">Input manual / pilih catatan pelanggaran</option>
                      {dataPelanggaran.map((item, index) => {
                        const name = item.nama_siswa || item.nama || 'Siswa';
                        const violation = item.jenis_pelanggaran || item.jenis || 'Pelanggaran';
                        return (
                          <option
                            key={item.id ?? `${name}-${index}`}
                            value={String(item.id ?? '')}
                            disabled={item.id == null}
                          >
                            {name} - {item.kelas || '-'} - {violation}
                          </option>
                        );
                      })}
                    </select>
                    <p
                      role="status"
                      style={{
                        margin: '6px 0 0',
                        color: loadingParentPhone
                          ? '#fbbf24'
                          : parentPhone
                            ? '#34d399'
                            : '#94a3b8',
                        fontSize: '11px',
                      }}
                    >
                      {loadingParentPhone
                        ? 'Memuat nomor orang tua...'
                        : parentPhone
                          ? 'Nomor WhatsApp orang tua tersedia untuk pengiriman surat.'
                          : 'Isi manual nomor WhatsApp orang tua/wali di bawah jika belum terisi otomatis.'}
                    </p>
                    <label
                      style={{
                        display: 'grid',
                        gap: '5px',
                        marginTop: '10px',
                        color: '#cbd5e1',
                        fontSize: '12px',
                        fontWeight: '700',
                      }}
                    >
                      Nomor WhatsApp orang tua / wali
                      <input
                        type="tel"
                        value={parentPhone}
                        onChange={(event) => setParentPhone(event.target.value)}
                        placeholder="Contoh: 081234567890"
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: '10px',
                          background: '#064e3b',
                          color: '#fff',
                          border: '1px solid rgba(52,211,153,0.3)',
                          boxSizing: 'border-box',
                        }}
                      />
                    </label>
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: '12px',
                        color: '#cbd5e1',
                        fontWeight: '700',
                        display: 'block',
                        marginBottom: '5px',
                      }}
                    >
                      Nama Siswa
                    </label>
                    <input
                      type="text"
                      required
                      value={namaSiswa}
                      onChange={(e) => setNamaSiswa(e.target.value)}
                      placeholder="Contoh: gesya fikry"
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '10px',
                        background: '#064e3b',
                        color: '#fff',
                        border: '1px solid rgba(52,211,153,0.3)',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: '12px',
                        color: '#cbd5e1',
                        fontWeight: '700',
                        display: 'block',
                        marginBottom: '5px',
                      }}
                    >
                      Kelas
                    </label>
                    <input
                      type="text"
                      required
                      value={kelas}
                      onChange={(e) => setKelas(e.target.value)}
                      placeholder="Contoh: XI RPL 2"
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '10px',
                        background: '#064e3b',
                        color: '#fff',
                        border: '1px solid rgba(52,211,153,0.3)',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: '12px',
                        color: '#cbd5e1',
                        fontWeight: '700',
                        display: 'block',
                        marginBottom: '5px',
                      }}
                    >
                      Keperluan / Alasan Pemanggilan
                    </label>
                    <input
                      type="text"
                      required
                      value={keperluan}
                      onChange={(e) => setKeperluan(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '10px',
                        background: '#064e3b',
                        color: '#fff',
                        border: '1px solid rgba(52,211,153,0.3)',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label
                        style={{
                          fontSize: '12px',
                          color: '#cbd5e1',
                          fontWeight: '700',
                          display: 'block',
                          marginBottom: '5px',
                        }}
                      >
                        Tanggal
                      </label>
                      <input
                        type="date"
                        required
                        value={tanggalPanggilan}
                        onChange={(e) => setTanggalPanggilan(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: '10px',
                          background: '#064e3b',
                          color: '#fff',
                          border: '1px solid rgba(52,211,153,0.3)',
                          boxSizing: 'border-box',
                          outline: 'none',
                        }}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          fontSize: '12px',
                          color: '#cbd5e1',
                          fontWeight: '700',
                          display: 'block',
                          marginBottom: '5px',
                        }}
                      >
                        Pukul
                      </label>
                      <input
                        type="text"
                        required
                        value={pukul}
                        onChange={(e) => setPukul(e.target.value)}
                        placeholder="09:00"
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: '10px',
                          background: '#064e3b',
                          color: '#fff',
                          border: '1px solid rgba(52,211,153,0.3)',
                          boxSizing: 'border-box',
                          outline: 'none',
                        }}
                      />
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: '10px',
                      justifyContent: 'flex-end',
                      marginTop: '12px',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.08)',
                        color: '#fff',
                        border: '1px solid rgba(52,211,153,0.3)',
                        padding: '10px 18px',
                        borderRadius: '10px',
                        fontWeight: '700',
                        cursor: 'pointer',
                      }}
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      style={{
                        background: '#059669',
                        color: '#fff',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '10px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(5,150,105,0.4)',
                      }}
                    >
                      Simpan & Buat Surat
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <footer
            style={{
              background: 'linear-gradient(135deg, #021f18 0%, #064e3b 100%)',
              color: '#a7f3d0',
              padding: '16px',
              textAlign: 'center',
              fontSize: '11.5px',
              borderTop: '1px solid rgba(52, 211, 153, 0.2)',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            &copy; 2026 Panel Bimbingan Konseling MindGuard - SMK Budi Bakti Ciwidey
          </footer>
        </div>
      </div>
    </>
  );
}