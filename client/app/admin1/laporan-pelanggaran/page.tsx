'use client';

import { useEffect, useState } from 'react';
import { Printer, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

type ViolationReportRecord = {
  id?: string | number;
  tanggal?: string;
  nama_siswa?: string;
  kelas?: string;
  jenis_pelanggaran?: string;
  keterangan?: string;
  tindakan?: string;
  poin?: number;
  pencatat?: string;
  sumber: string;
};

export default function LaporanPelanggaranPage() {
  const [data, setData] = useState<ViolationReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const loadReport = async () => {
      const [adminResult, osisResult] = await Promise.all([
        supabase.from('pelanggaran').select('*').order('tanggal', { ascending: false }),
        supabase.from('pelanggaran_siswa').select('*').order('tanggal', { ascending: false }),
      ]);

      const records: ViolationReportRecord[] = [
        ...((adminResult.data || []) as Omit<ViolationReportRecord, 'sumber'>[]).map((record) => ({
          ...record,
          sumber: 'Panel Admin',
        })),
        ...((osisResult.data || []) as Omit<ViolationReportRecord, 'sumber'>[]).map((record) => ({
          ...record,
          sumber: 'OSIS / Piket',
        })),
      ].sort(
        (first, second) =>
          new Date(second.tanggal || 0).getTime() - new Date(first.tanggal || 0).getTime()
      );

      if (isMounted) {
        setData(records);
        setLoadError(
          [adminResult.error, osisResult.error]
            .filter(Boolean)
            .map((error) => error?.message)
            .join(' ')
        );
        setLoading(false);
      }
    };
    void loadReport();
    return () => {
      isMounted = false;
    };
  }, []);

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = 'Laporan Pelanggaran Siswa';
    window.addEventListener(
      'afterprint',
      () => {
        document.title = originalTitle;
      },
      { once: true }
    );
    window.print();
  };

  const tanggalCetak = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <>
      <style>{`
        .report-print-header,
        .report-print-only {
          display: none;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 14mm 15mm 14mm;
          }

          /* Reset total background gelap dari layout admin menjadi putih bersih */
          html,
          body,
          html body > div,
          html body .admin-panel,
          html body .admin-panel-main,
          html body main {
            display: block !important;
            width: 100% !important;
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
            -webkit-text-fill-color: #000000 !important;
            box-shadow: none !important;
            border: none !important;
          }

          /* Sembunyikan sidebar, tombol aksi, & widget mengambang */
          html body .admin-panel-sidebar,
          html body aside,
          html body nav,
          html body .report-print-action,
          html body .violation-report-heading,
          html body [class*="mindy"],
          html body [class*="Mindy"],
          html body [style*="position: fixed"] {
            display: none !important;
          }

          .report-print-only {
            display: block !important;
          }

          /* Paksa seluruh teks & elemen cetak berwarna hitam pekat */
          html body .violation-report,
          html body .violation-report * {
            color: #000000 !important;
            -webkit-text-fill-color: #000000 !important;
            box-shadow: none !important;
            text-shadow: none !important;
            font-family: Arial, Helvetica, sans-serif !important;
          }

          html body .violation-report {
            gap: 10px !important;
            background: #ffffff !important;
            background-color: #ffffff !important;
          }

          /* Kop Surat */
          .report-print-header {
            display: grid !important;
            grid-template-columns: 64px 1fr 64px;
            align-items: center;
            gap: 10px;
            padding: 0 0 10px 0;
            border-bottom: 3px double #000000 !important;
            text-align: center;
            background-color: #ffffff !important;
          }

          .report-print-logo {
            width: 58px !important;
            height: 58px !important;
            object-fit: contain;
          }

          .report-print-school {
            margin: 0 0 2px 0;
            font-size: 9pt;
            font-weight: 600;
            letter-spacing: 0.4px;
          }

          .report-print-school-name {
            margin: 0;
            font-size: 14.5pt;
            font-weight: 800;
          }

          .report-print-address {
            margin: 2px 0 0 0;
            font-size: 8pt;
          }

          .report-print-title {
            text-align: center;
            margin: 4px 0 2px 0;
            font-size: 11pt;
            font-weight: 800;
            letter-spacing: 0.3px;
          }

          /* Baris Ringkasan & Tanggal Cetak */
          .violation-report-summary {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            padding: 0 !important;
            border: 0 !important;
            background: #ffffff !important;
            background-color: #ffffff !important;
          }

          .violation-report-summary p {
            font-size: 8.5pt !important;
            margin: 0 !important;
          }

          /* Tabel Cetak Berbingkai Tegas */
          .violation-report-table-wrap {
            overflow: visible !important;
            border: 0 !important;
            border-radius: 0 !important;
            background: #ffffff !important;
            background-color: #ffffff !important;
          }

          html body .violation-report table {
            width: 100% !important;
            min-width: 0 !important;
            table-layout: fixed;
            border-collapse: collapse !important;
            font-size: 8pt !important;
            background-color: #ffffff !important;
          }

          .violation-report thead {
            display: table-header-group;
          }

          .violation-report tr {
            break-inside: avoid;
            page-break-inside: avoid;
            background-color: #ffffff !important;
          }

          html body .violation-report th,
          html body .violation-report td {
            border: 1px solid #000000 !important;
            padding: 5px 5px !important;
            line-height: 1.3;
            vertical-align: top;
            overflow-wrap: break-word;
            word-break: break-word;
            white-space: normal !important;
          }

          html body .violation-report th {
            background-color: #f1f5f9 !important;
            font-weight: 700 !important;
            text-align: center !important;
          }

          html body .violation-report td {
            background-color: #ffffff !important;
          }

          .print-center {
            text-align: center !important;
          }

          /* Proporsi Kolom (Total 100%) */
          .violation-report th:nth-child(1),
          .violation-report td:nth-child(1) {
            width: 4%;
            white-space: nowrap !important;
          }
          .violation-report th:nth-child(2),
          .violation-report td:nth-child(2) {
            width: 11%;
            white-space: nowrap !important;
          }
          .violation-report th:nth-child(3),
          .violation-report td:nth-child(3) {
            width: 15%;
          }
          .violation-report th:nth-child(4),
          .violation-report td:nth-child(4) {
            width: 8%;
          }
          .violation-report th:nth-child(5),
          .violation-report td:nth-child(5) {
            width: 20%;
          }
          .violation-report th:nth-child(6),
          .violation-report td:nth-child(6) {
            width: 6%;
          }
          .violation-report th:nth-child(7),
          .violation-report td:nth-child(7) {
            width: 11%;
          }
          .violation-report th:nth-child(8),
          .violation-report td:nth-child(8) {
            width: 9%;
          }
          .violation-report th:nth-child(9),
          .violation-report td:nth-child(9) {
            width: 16%;
          }

          /* Blok Tanda Tangan */
          .report-ttd-wrapper {
            display: flex !important;
            justify-content: flex-end;
            margin-top: 22px;
            break-inside: avoid;
            page-break-inside: avoid;
            background-color: #ffffff !important;
          }

          .report-ttd-box {
            width: 210px;
            font-size: 8.5pt;
            line-height: 1.4;
            text-align: left;
          }

          .report-ttd-space {
            height: 50px;
          }
        }
      `}</style>

      <div
        className="violation-report"
        style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
      >
        {/* Kop Surat (Hanya muncul saat dicetak) */}
        <header className="report-print-header">
          <Image
            className="report-print-logo"
            src="/logo-smk.png"
            alt="Logo SMK Budi Bakti Ciwidey"
            width={512}
            height={512}
            priority
          />
          <div>
            <p className="report-print-school">PEMERINTAH PROVINSI JAWA BARAT</p>
            <h1 className="report-print-school-name">SMK BUDI BAKTI CIWIDEY</h1>
            <p className="report-print-address">
              Jl. Babakantiga No. 82, Ciwidey, Kabupaten Bandung, Jawa Barat 40973
            </p>
          </div>
          <span aria-hidden="true" />
        </header>

        <h2 className="report-print-only report-print-title">LAPORAN PELANGGARAN SISWA</h2>

        {/* Header Dashboard (Hanya tampil di layar) */}
        <div
          className="violation-report-heading"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '14px',
            borderBottom: '1px solid #193328',
            paddingBottom: '16px',
          }}
        >
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: 0 }}>
              LAPORAN PELANGGARAN
            </h1>
            <p style={{ fontSize: '12px', color: '#688c7d', margin: '4px 0 0 0' }}>
              Rekapitulasi pelanggaran siswa dari panel admin dan OSIS
            </p>
          </div>
          <button
            className="report-print-action"
            type="button"
            onClick={handlePrint}
            disabled={loading || data.length === 0}
            style={{
              backgroundColor: '#34d399',
              color: '#07100d',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: loading || data.length === 0 ? 'not-allowed' : 'pointer',
              opacity: loading || data.length === 0 ? 0.6 : 1,
            }}
          >
            <Printer size={16} /> Cetak Laporan
          </button>
        </div>

        {/* Ringkasan & Tanggal Cetak */}
        <div
          className="violation-report-summary"
          style={{
            backgroundColor: '#13261f',
            border: '1px solid #1d3d30',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <p style={{ fontSize: '12px', color: '#cbd5e1', margin: 0 }}>
            Total pelanggaran:{' '}
            <strong style={{ color: '#34d399' }}>
              {loading ? 'Memuat...' : `${data.length} data`}
            </strong>
          </p>
          <p className="report-print-only" style={{ margin: 0 }}>
            Tanggal Cetak: {tanggalCetak}
          </p>
        </div>

        {loadError && (
          <p role="alert" style={{ margin: 0, color: '#f87171', fontSize: '12px' }}>
            Sebagian data gagal dimuat: {loadError}
          </p>
        )}

        {/* Tabel Data Pelanggaran */}
        <div
          className="violation-report-table-wrap"
          style={{
            overflowX: 'auto',
            backgroundColor: '#13261f',
            border: '1px solid #1d3d30',
            borderRadius: '12px',
          }}
        >
          <table
            style={{
              width: '100%',
              minWidth: '880px',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: '12px',
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#10201a', color: '#a7f3d0' }}>
                {[
                  'No',
                  'Tanggal',
                  'Nama Siswa',
                  'Kelas',
                  'Jenis Pelanggaran',
                  'Poin',
                  'Petugas',
                  'Sumber',
                  'Keterangan',
                ].map((heading) => (
                  <th
                    key={heading}
                    scope="col"
                    style={{
                      padding: '12px 10px',
                      borderBottom: '1px solid #193328',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ padding: '24px', color: '#688c7d', textAlign: 'center' }}>
                    <Loader2
                      size={17}
                      className="animate-spin"
                      style={{ display: 'inline', marginRight: '7px' }}
                    />
                    Memuat laporan...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '24px', color: '#688c7d', textAlign: 'center' }}>
                    Belum ada data pelanggaran.
                  </td>
                </tr>
              ) : (
                data.map((record, index) => (
                  <tr key={`${record.sumber}-${record.id || index}`} style={{ color: '#e2e8f0' }}>
                    <td
                      className="print-center"
                      style={{ padding: '11px 10px', borderBottom: '1px solid #193328' }}
                    >
                      {index + 1}
                    </td>
                    <td
                      className="print-center"
                      style={{
                        padding: '11px 10px',
                        borderBottom: '1px solid #193328',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {record.tanggal || '-'}
                    </td>
                    <td
                      style={{
                        padding: '11px 10px',
                        borderBottom: '1px solid #193328',
                        fontWeight: 700,
                        color: '#fff',
                      }}
                    >
                      {record.nama_siswa || '-'}
                    </td>
                    <td
                      className="print-center"
                      style={{ padding: '11px 10px', borderBottom: '1px solid #193328' }}
                    >
                      {record.kelas || '-'}
                    </td>
                    <td style={{ padding: '11px 10px', borderBottom: '1px solid #193328' }}>
                      {record.jenis_pelanggaran || '-'}
                    </td>
                    <td
                      className="print-center"
                      style={{
                        padding: '11px 10px',
                        borderBottom: '1px solid #193328',
                        color: '#34d399',
                        fontWeight: 700,
                      }}
                    >
                      {Number(record.poin || 0)}
                    </td>
                    <td style={{ padding: '11px 10px', borderBottom: '1px solid #193328' }}>
                      {record.pencatat || '-'}
                    </td>
                    <td
                      className="print-center"
                      style={{
                        padding: '11px 10px',
                        borderBottom: '1px solid #193328',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {record.sumber}
                    </td>
                    <td style={{ padding: '11px 10px', borderBottom: '1px solid #193328' }}>
                      {record.keterangan || record.tindakan || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Blok Tanda Tangan (Hanya muncul saat dicetak) */}
        <div className="report-print-only">
          <div className="report-ttd-wrapper">
            <div className="report-ttd-box">
              <p style={{ margin: 0 }}>Ciwidey, {tanggalCetak}</p>
              <p style={{ margin: '2px 0 0 0' }}>Wakasek Kesiswaan / Guru BK,</p>
              <div className="report-ttd-space" />
              <p style={{ margin: 0, fontWeight: 700 }}>_____________________________</p>
              <p style={{ margin: '2px 0 0 0' }}>NIP. -</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}