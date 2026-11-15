'use client';

import React, { useState, useEffect } from 'react';
import { Printer } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type CounselingRow = Record<string, unknown> & {
  id: string | number;
};

function getField(row: CounselingRow, keys: string[], fallback = '-'): string {
  for (const key of keys) {
    const val = row[key];
    if (val !== null && val !== undefined && String(val).trim() !== '') {
      return String(val);
    }
  }
  return fallback;
}

function formatTanggal(raw: string): string {
  if (!raw || raw === '-') return '-';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function LaporanKonselingPage() {
  const [data, setData] = useState<CounselingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const loadCounseling = async () => {
      setLoading(true);
      const { data: rows, error } = await supabase
        .from('layanan_siswa')
        .select('*')
        .in('layanan', ['KONSELING', 'KELOMPOK']);

      if (!isMounted) return;

      if (error) {
        console.error('Gagal memuat laporan konseling:', error);
        setLoadError(error.message);
      } else {
        const sorted = ((rows || []) as CounselingRow[]).sort((a, b) => {
          const dateA = getField(a, ['tanggal', 'tgl_konseling', 'created_at'], '');
          const dateB = getField(b, ['tanggal', 'tgl_konseling', 'created_at'], '');
          return dateB.localeCompare(dateA);
        });
        setData(sorted);
      }
      setLoading(false);
    };

    void loadCounseling();
    return () => {
      isMounted = false;
    };
  }, []);

  const tanggalCetak = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <>
      <style>{`
        /* Tampilan Layar */
        .print-only {
          display: none;
        }

        .screen-table-wrapper {
          overflow-x: auto;
          margin-top: 14px;
        }

        .report-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }

        .report-table th,
        .report-table td {
          padding: 9px 10px;
          text-align: left;
          vertical-align: top;
          border-bottom: 1px solid #1d3d30;
          color: #e2e8f0;
        }

        .report-table th {
          color: #34d399;
          font-weight: 700;
          background-color: #0e1d17;
          white-space: nowrap;
        }

        /* Aturan Cetak A4 Putih Bersih & Teks Hitam Pekat */
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 14mm 15mm 14mm;
          }

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

          /* Sembunyikan sidebar, tombol layar, & widget melayang Teman Mindy */
          html body .admin-panel-sidebar,
          html body aside,
          html body nav,
          html body .no-print,
          html body [class*="mindy"],
          html body [class*="Mindy"],
          html body [style*="position: fixed"] {
            display: none !important;
          }

          .print-only {
            display: block !important;
          }

          html body .print-sheet,
          html body .print-sheet * {
            color: #000000 !important;
            -webkit-text-fill-color: #000000 !important;
            box-shadow: none !important;
            text-shadow: none !important;
            font-family: Arial, Helvetica, sans-serif !important;
          }

          html body .print-sheet,
          html body .print-card {
            background: #ffffff !important;
            background-color: #ffffff !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          /* Kop Surat */
          .kop-surat {
            display: grid !important;
            grid-template-columns: 64px 1fr 64px;
            align-items: center;
            gap: 10px;
            padding-bottom: 10px;
            margin-bottom: 12px;
            border-bottom: 3px double #000000 !important;
            text-align: center;
          }

          .kop-logo {
            width: 58px !important;
            height: 58px !important;
            object-fit: contain;
          }

          .kop-provinsi {
            font-size: 9pt;
            font-weight: 600;
            letter-spacing: 0.4px;
            margin: 0 0 2px 0;
          }

          .kop-sekolah {
            font-size: 14.5pt;
            font-weight: 800;
            margin: 0;
          }

          .kop-alamat {
            font-size: 8pt;
            margin: 2px 0 0 0;
          }

          .judul-laporan {
            text-align: center;
            font-size: 11pt;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            margin: 6px 0 10px 0;
          }

          .meta-bar {
            display: flex !important;
            justify-content: space-between;
            align-items: center;
            font-size: 8.5pt;
            margin-bottom: 8px;
          }

          .meta-bar p {
            font-size: 8.5pt !important;
          }

          /* Hilangkan overflow scrollbar saat dicetak */
          .screen-table-wrapper {
            overflow: visible !important;
            margin-top: 6px !important;
          }

          /* Tabel Cetak Formal */
          html body .report-table {
            width: 100% !important;
            min-width: 0 !important;
            table-layout: fixed;
            border-collapse: collapse !important;
            font-size: 8pt !important;
            background-color: #ffffff !important;
          }

          .report-table thead {
            display: table-header-group;
          }

          .report-table tr {
            break-inside: avoid;
            page-break-inside: avoid;
            background-color: #ffffff !important;
          }

          html body .report-table th,
          html body .report-table td {
            border: 1px solid #000000 !important;
            padding: 5px 5px !important;
            line-height: 1.3;
            vertical-align: top;
            overflow-wrap: break-word;
            word-break: break-word;
          }

          html body .report-table th {
            background-color: #f1f5f9 !important;
            font-weight: 700 !important;
            text-align: center !important;
          }

          html body .report-table td {
            background-color: #ffffff !important;
          }

          /* Proporsi Lebar 8 Kolom (Total 100%) */
          .report-table th:nth-child(1),
          .report-table td:nth-child(1) {
            width: 4%;
            white-space: nowrap !important;
          }
          .report-table th:nth-child(2),
          .report-table td:nth-child(2) {
            width: 11%;
            white-space: nowrap !important;
          }
          .report-table th:nth-child(3),
          .report-table td:nth-child(3) {
            width: 16%;
          }
          .report-table th:nth-child(4),
          .report-table td:nth-child(4) {
            width: 9%;
          }
          .report-table th:nth-child(5),
          .report-table td:nth-child(5) {
            width: 11%;
          }
          .report-table th:nth-child(6),
          .report-table td:nth-child(6) {
            width: 21%;
          }
          .report-table th:nth-child(7),
          .report-table td:nth-child(7) {
            width: 16%;
          }
          .report-table th:nth-child(8),
          .report-table td:nth-child(8) {
            width: 12%;
          }

          .text-center-print {
            text-align: center !important;
          }

          /* Blok Tanda Tangan */
          .ttd-wrapper {
            display: flex !important;
            justify-content: flex-end;
            margin-top: 22px;
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .ttd-box {
            width: 210px;
            text-align: left;
            font-size: 8.5pt;
            line-height: 1.4;
          }

          .ttd-space {
            height: 50px;
          }
        }
      `}</style>

      <div className="print-sheet" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Header Dashboard (Hanya tampil di layar) */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #193328',
            paddingBottom: '16px',
          }}
        >
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: 0 }}>
              LAPORAN KONSELING
            </h1>
            <p style={{ fontSize: '12px', color: '#688c7d', margin: '4px 0 0 0' }}>
              Rekapitulasi seluruh sesi bimbingan dan konseling siswa
            </p>
          </div>
          <button
            onClick={() => window.print()}
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
              cursor: 'pointer',
            }}
          >
            <Printer size={16} /> Cetak Laporan
          </button>
        </div>

        {/* Area Utama Laporan */}
        <div
          className="print-card"
          style={{
            backgroundColor: '#13261f',
            border: '1px solid #1d3d30',
            borderRadius: '12px',
            padding: '20px',
          }}
        >
          {/* Kop Surat (Hanya muncul saat dicetak) */}
          <div className="print-only">
            <div className="kop-surat">
              <img
                src="/logo-smk.png"
                alt="Logo SMK Budi Bakti Ciwidey"
                className="kop-logo"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div>
                <p className="kop-provinsi">PEMERINTAH PROVINSI JAWA BARAT</p>
                <h2 className="kop-sekolah">SMK BUDI BAKTI CIWIDEY</h2>
                <p className="kop-alamat">
                  Jl. Babakantiga No. 82, Ciwidey, Kabupaten Bandung, Jawa Barat 40973
                </p>
              </div>
              <span aria-hidden="true" />
            </div>
            <h3 className="judul-laporan">LAPORAN KONSELING SISWA</h3>
          </div>

          {/* Ringkasan & Tanggal Cetak */}
          <div
            className="meta-bar"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <p style={{ fontSize: '12px', color: '#cbd5e1', margin: 0 }}>
              Total sesi konseling: <strong style={{ color: '#34d399' }}>{data.length} data</strong>
            </p>
            <p className="print-only" style={{ margin: 0 }}>
              Tanggal Cetak: {tanggalCetak}
            </p>
          </div>

          {loadError && (
            <p role="alert" style={{ fontSize: '12px', color: '#f87171', margin: '10px 0 0' }}>
              Gagal memuat laporan konseling: {loadError}
            </p>
          )}

          {/* Tabel Data Konseling */}
          <div className="screen-table-wrapper">
            <table className="report-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Tanggal</th>
                  <th>Nama Siswa</th>
                  <th>Kelas</th>
                  <th>Jenis Layanan</th>
                  <th>Topik / Permasalahan</th>
                  <th>Keterangan / Tindak Lanjut</th>
                  <th>Petugas / Konselor</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '16px' }}>
                      Memuat data laporan konseling...
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '16px' }}>
                      Belum ada data konseling yang tercatat.
                    </td>
                  </tr>
                ) : (
                  data.map((row, index) => {
                    const tanggal = formatTanggal(
                      getField(row, ['tanggal', 'tgl_konseling', 'created_at'])
                    );
                    const namaSiswa = getField(row, ['nama_siswa', 'nama', 'siswa_nama']);
                    const kelas = getField(row, ['kelas', 'rombel']);
                    const layanan = getField(row, ['layanan', 'jenis_layanan']);
                    const topik = getField(row, [
                      'topik',
                      'masalah',
                      'permasalahan',
                      'keluhan',
                      'judul',
                    ]);
                    const keterangan = getField(row, [
                      'keterangan',
                      'tindak_lanjut',
                      'hasil',
                      'catatan',
                    ]);
                    const petugas = getField(row, [
                      'petugas',
                      'konselor',
                      'guru_bk',
                      'nama_petugas',
                    ]);

                    return (
                      <tr key={row.id ?? index}>
                        <td className="text-center-print">{index + 1}</td>
                        <td className="text-center-print">{tanggal}</td>
                        <td style={{ fontWeight: 600 }}>{namaSiswa}</td>
                        <td className="text-center-print">{kelas}</td>
                        <td className="text-center-print">{layanan}</td>
                        <td>{topik}</td>
                        <td>{keterangan}</td>
                        <td>{petugas}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Blok Tanda Tangan (Hanya muncul saat dicetak) */}
          <div className="print-only">
            <div className="ttd-wrapper">
              <div className="ttd-box">
                <p style={{ margin: 0 }}>Ciwidey, {tanggalCetak}</p>
                <p style={{ margin: '2px 0 0 0' }}>Guru Bimbingan dan Konseling,</p>
                <div className="ttd-space" />
                <p style={{ margin: 0, fontWeight: 700 }}>_____________________________</p>
                <p style={{ margin: '2px 0 0 0' }}>NIP. -</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}