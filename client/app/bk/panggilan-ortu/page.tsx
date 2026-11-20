'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import BKUtilityBar from '../BKUtilityBar';
import { supabase } from '@/lib/supabase';
import type { DatabaseRow } from '@/lib/database-row';
import { formatErrorMessage } from '@/lib/error-utils';
import { showError, showSuccess } from '@/lib/swal';
import { PhoneCall, Plus, Printer, ClipboardList, Calendar, FileText, MessageCircle, Loader2 } from 'lucide-react';

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

function isMissingParentPhoneColumn(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const value = error as { code?: string; message?: string };
  const message = (value.message || '').toLowerCase();
  return message.includes('parent_phone')
    && (value.code === 'PGRST204' || message.includes('column') || message.includes('schema cache'));
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
  const [tanggalPanggilan, setTanggalPanggilan] = useState(new Date().toISOString().split('T')[0]);
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
          parent_phone: typeof row.parent_phone === 'string'
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
        if (isMissingParentPhoneColumn(error)) {
          savedWithoutParentPhone = true;
          break;
        }
      }

      if (savedWithoutParentPhone) {
        for (const payload of payloadCandidates) {
          const compatiblePayload = Object.fromEntries(
            Object.entries(payload).filter(([key]) => key !== 'parent_phone'),
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
          savedWithoutParentPhone
            ? 'Surat tersimpan. Nomor WhatsApp hanya tersedia sampai halaman ini ditutup karena kolom nomor wali belum terbaca. Sinkronkan skema Supabase agar nomor tersimpan permanen.'
            : 'Surat panggilan orang tua berhasil disimpan.',
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

  const handleSendPdfWhatsApp = async (item: DatabaseRow, phone: string) => {
    if (item.id == null) {
      showError('Surat belum tersimpan', 'ID surat panggilan tidak tersedia.');
      return;
    }
    if (!phone.trim()) {
      showError('Nomor WhatsApp belum diisi', 'Masukkan nomor orang tua/wali terlebih dahulu.');
      return;
    }

    const confirmed = window.confirm(
      `Kirim PDF surat panggilan untuk ${String(item.nama_siswa || 'siswa')} ke ${phone}? Pengiriman langsung memerlukan percakapan aktif dengan nomor sekolah.`,
    );
    if (!confirmed) return;

    const callId = String(item.id);
    setSendingCallId(callId);
    try {
      const response = await fetch('/api/bk/panggilan-ortu/send-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId, namaGuruBK, parentPhone: phone }),
      });
      const result = await response.json() as { error?: string; success?: boolean };
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'WhatsApp gagal mengirim PDF surat.');
      }

      showSuccess('PDF berhasil dikirim', 'PDF surat panggilan telah dikirim ke WhatsApp orang tua/wali.');
    } catch (error) {
      console.error('Gagal mengirim PDF surat panggilan:', error);
      showError('PDF gagal dikirim', error instanceof Error ? error.message : 'Terjadi kesalahan saat mengirim PDF.');
    } finally {
      setSendingCallId(null);
    }
  };

  useEffect(() => {
    const session = localStorage.getItem('user_session') || localStorage.getItem('admin_session');
    if (!session) {
      router.push('/');
      return;
    }

    const savedBKName = localStorage.getItem('bk_custom_name') || '';
    if (savedBKName && savedBKName.toLowerCase() !== 'umum') {
      queueMicrotask(() => setNamaGuruBK(savedBKName));
    }

    queueMicrotask(() => {
      void fetchPanggilan();
      void fetchPelanggaran();
    });
  }, [fetchPanggilan, fetchPelanggaran, router]);

  const nomorUrutSurat = useMemo(() => {
    if (!printItem) return '001';
    const chronological = [...dataPanggilan].reverse();
    const foundIndex = chronological.findIndex((row) => String(row.id) === String(printItem.id));
    const urutan = foundIndex >= 0 ? foundIndex + 1 : 1;
    return String(urutan).padStart(3, '0');
  }, [dataPanggilan, printItem]);

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

          /* Sembunyikan seluruh elemen dashboard & widget mengambang */
          .bk-panel-page,
          [class*="mindy"],
          [class*="Mindy"],
          [style*="position: fixed"] {
            display: none !important;
          }

          /* Ukuran A4 presisi dengan margin standar surat dinas (20mm atas/bawah, 24mm kiri/kanan) */
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

          /* Kop Surat Resmi */
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
            {/* INFO & TOMBOL AKSI */}
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
              <div>
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
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '12.5px' }}>
                  Pilih pelanggaran siswa agar identitas dan alasan terisi otomatis, lalu cetak
                  surat resmi ber-kop sekolah.
                </p>
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
                filteredPanggilan.map((item) => (
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
                    <label className="mb-2 mt-3 block text-xs font-semibold text-emerald-200" htmlFor={`parent-phone-${item.id}`}>
                      Nomor WhatsApp orang tua / wali
                    </label>
                    <input
                      id={`parent-phone-${item.id}`}
                      type="tel"
                      value={parentPhoneByCallId[String(item.id)] ?? (typeof item.parent_phone === 'string' ? item.parent_phone : '')}
                      onChange={(event) => setParentPhoneByCallId((current) => ({
                        ...current,
                        [String(item.id)]: event.target.value,
                      }))}
                      placeholder="Contoh: 081234567890"
                      className="mb-2 w-full rounded-lg border border-emerald-800 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => void handleSendPdfWhatsApp(
                        item,
                        parentPhoneByCallId[String(item.id)] ?? (typeof item.parent_phone === 'string' ? item.parent_phone : ''),
                      )}
                      disabled={sendingCallId !== null || !(parentPhoneByCallId[String(item.id)] ?? (typeof item.parent_phone === 'string' ? item.parent_phone : '')).trim()}
                      className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-700 px-3 py-2 text-sm font-bold text-emerald-300 hover:bg-emerald-950 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {sendingCallId === String(item.id)
                        ? <Loader2 size={16} className="animate-spin" />
                        : <MessageCircle size={16} />}
                      {sendingCallId === String(item.id) ? 'Mengirim PDF...' : 'Kirim PDF langsung via WhatsApp'}
                    </button>
                  </div>
                ))
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
                    <p role="status" style={{ margin: '6px 0 0', color: loadingParentPhone ? '#fbbf24' : parentPhone ? '#34d399' : '#94a3b8', fontSize: '11px' }}>
                      {loadingParentPhone
                        ? 'Memuat nomor orang tua...'
                        : parentPhone
                          ? 'Nomor WhatsApp orang tua tersedia untuk pengiriman surat.'
                          : 'Nomor orang tua belum tersedia; lengkapi data siswa terlebih dahulu.'}
                    </p>
                    <label style={{ display: 'grid', gap: '5px', marginTop: '10px', color: '#cbd5e1', fontSize: '12px', fontWeight: '700' }}>
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