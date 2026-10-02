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
        ...((adminResult.data || []) as Omit<ViolationReportRecord, 'sumber'>[]).map((record) => ({ ...record, sumber: 'Panel Admin' })),
        ...((osisResult.data || []) as Omit<ViolationReportRecord, 'sumber'>[]).map((record) => ({ ...record, sumber: 'OSIS / Piket' })),
      ].sort((first, second) => new Date(second.tanggal || 0).getTime() - new Date(first.tanggal || 0).getTime());

      if (isMounted) {
        setData(records);
        setLoadError([adminResult.error, osisResult.error].filter(Boolean).map((error) => error?.message).join(' '));
        setLoading(false);
      }
    };
    void loadReport();
    return () => { isMounted = false; };
  }, []);

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = 'Laporan Pelanggaran Siswa';
    window.addEventListener('afterprint', () => {
      document.title = originalTitle;
    }, { once: true });
    window.print();
  };

  return (
    <>
      <style>{`
        .report-print-header { display: none; }
        @page { size: auto; margin: 0; }
        @media print {
          body { background: #fff !important; }
          .admin-panel { display: block !important; width: auto !important; min-height: 0 !important; padding: 0 !important; background: #fff !important; color: #111 !important; }
          .admin-panel-sidebar, .report-print-action { display: none !important; }
          .admin-panel-main { overflow: visible !important; padding: 12mm 14mm !important; border: 0 !important; background: #fff !important; color: #111 !important; }
          .violation-report, .violation-report * { color: #111 !important; box-shadow: none !important; }
          .violation-report { gap: 10px !important; }
          .report-print-header { display: grid !important; grid-template-columns: 76px 1fr 76px; align-items: center; gap: 12px; padding: 0 0 10px; border-bottom: 2px solid #222; text-align: center; }
          .report-print-logo { width: 70px !important; height: 70px !important; object-fit: contain; }
          .report-print-school { margin: 0 0 3px; font-size: 9pt; font-weight: 600; }
          .report-print-school-name { margin: 0; font-size: 16pt; font-weight: 800; }
          .report-print-address { margin: 3px 0 0; font-size: 8pt; }
          .report-print-title { margin: 8px 0 0; font-size: 11pt; font-weight: 700; }
          .violation-report-heading { display: none !important; }
          .violation-report-summary { padding: 0 !important; border: 0 !important; background: #fff !important; }
          .violation-report-table-wrap { overflow: visible !important; border: 0 !important; border-radius: 0 !important; }
          .violation-report table { width: 100% !important; min-width: 0 !important; table-layout: fixed; font-size: 8pt !important; }
          .violation-report th, .violation-report td { padding: 5px 6px !important; border-bottom: 1px solid #bbb !important; background: #fff !important; overflow-wrap: anywhere; }
          .violation-report th { border-bottom: 2px solid #555 !important; }
          .violation-report thead { display: table-header-group; }
          .violation-report tr { break-inside: avoid; page-break-inside: avoid; }
        }
        @media print and (orientation: portrait) {
          .report-print-header { grid-template-columns: 50px 1fr 50px; gap: 7px; padding-bottom: 7px; }
          .report-print-logo { width: 46px !important; height: 46px !important; }
          .report-print-school { font-size: 7pt; }
          .report-print-school-name { font-size: 12pt; }
          .report-print-address { font-size: 6.5pt; }
          .report-print-title { margin-top: 5px; font-size: 8pt; }
          .violation-report { gap: 7px !important; }
          .violation-report-summary p { font-size: 8pt !important; }
          .violation-report table { font-size: 6.5pt !important; }
          .violation-report th, .violation-report td { padding: 3px 3px !important; line-height: 1.2; }
          .violation-report th, .violation-report td:nth-child(1), .violation-report td:nth-child(7) { white-space: normal !important; }
          .violation-report th:nth-child(1), .violation-report td:nth-child(1) { width: 10%; }
          .violation-report th:nth-child(2), .violation-report td:nth-child(2) { width: 15%; }
          .violation-report th:nth-child(3), .violation-report td:nth-child(3) { width: 8%; }
          .violation-report th:nth-child(4), .violation-report td:nth-child(4) { width: 19%; }
          .violation-report th:nth-child(5), .violation-report td:nth-child(5) { width: 6%; }
          .violation-report th:nth-child(6), .violation-report td:nth-child(6) { width: 11%; }
          .violation-report th:nth-child(7), .violation-report td:nth-child(7) { width: 10%; }
          .violation-report th:nth-child(8), .violation-report td:nth-child(8) { width: 21%; }
        }
        @media print and (orientation: landscape) {
          .violation-report th:nth-child(1), .violation-report td:nth-child(1) { width: 8%; }
          .violation-report th:nth-child(2), .violation-report td:nth-child(2) { width: 14%; }
          .violation-report th:nth-child(3), .violation-report td:nth-child(3) { width: 7%; }
          .violation-report th:nth-child(4), .violation-report td:nth-child(4) { width: 19%; }
          .violation-report th:nth-child(5), .violation-report td:nth-child(5) { width: 6%; }
          .violation-report th:nth-child(6), .violation-report td:nth-child(6) { width: 11%; }
          .violation-report th:nth-child(7), .violation-report td:nth-child(7) { width: 10%; }
          .violation-report th:nth-child(8), .violation-report td:nth-child(8) { width: 25%; }
        }
      `}</style>
      <div className="violation-report" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <header className="report-print-header">
        <Image className="report-print-logo" src="/logo-smk.png" alt="Logo SMK Budi Bakti Ciwidey" width={512} height={512} priority />
        <div>
          <p className="report-print-school">PEMERINTAH PROVINSI JAWA BARAT</p>
          <h1 className="report-print-school-name">SMK BUDI BAKTI CIWIDEY</h1>
          <p className="report-print-address">Jl. Babakantiga No. 82, Ciwidey, Kabupaten Bandung, Jawa Barat 40973</p>
          <p className="report-print-title">LAPORAN PELANGGARAN SISWA</p>
        </div>
        <span aria-hidden="true" />
      </header>
      <div className="violation-report-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', borderBottom: '1px solid #193328', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: 0 }}>LAPORAN PELANGGARAN</h1>
          <p style={{ fontSize: '12px', color: '#688c7d', margin: '4px 0 0 0' }}>Rekapitulasi pelanggaran siswa dari panel admin dan OSIS</p>
        </div>
        <button className="report-print-action" type="button" onClick={handlePrint} disabled={loading || data.length === 0} style={{ backgroundColor: '#34d399', color: '#07100d', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: loading || data.length === 0 ? 'not-allowed' : 'pointer', opacity: loading || data.length === 0 ? 0.6 : 1 }}>
          <Printer size={16} /> Cetak Laporan
        </button>
      </div>

      <div className="violation-report-summary" style={{ backgroundColor: '#13261f', border: '1px solid #1d3d30', borderRadius: '12px', padding: '16px 20px' }}>
        <p style={{ fontSize: '12px', color: '#cbd5e1', margin: 0 }}>
          Total pelanggaran: <strong style={{ color: '#34d399' }}>{loading ? 'Memuat...' : `${data.length} data`}</strong>
        </p>
      </div>

      {loadError && <p role="alert" style={{ margin: 0, color: '#f87171', fontSize: '12px' }}>Sebagian data gagal dimuat: {loadError}</p>}
      <div className="violation-report-table-wrap" style={{ overflowX: 'auto', backgroundColor: '#13261f', border: '1px solid #1d3d30', borderRadius: '12px' }}>
        <table style={{ width: '100%', minWidth: '850px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
          <thead>
            <tr style={{ backgroundColor: '#10201a', color: '#a7f3d0' }}>
              {['Tanggal', 'Nama siswa', 'Kelas', 'Jenis pelanggaran', 'Poin', 'Petugas', 'Sumber', 'Keterangan'].map((heading) => <th key={heading} scope="col" style={{ padding: '12px 10px', borderBottom: '1px solid #193328', whiteSpace: 'nowrap' }}>{heading}</th>)}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: '24px', color: '#688c7d', textAlign: 'center' }}><Loader2 size={17} className="animate-spin" style={{ display: 'inline', marginRight: '7px' }} />Memuat laporan...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: '24px', color: '#688c7d', textAlign: 'center' }}>Belum ada data pelanggaran.</td></tr>
            ) : data.map((record, index) => (
              <tr key={`${record.sumber}-${record.id || index}`} style={{ color: '#e2e8f0' }}>
                <td style={{ padding: '11px 10px', borderBottom: '1px solid #193328', whiteSpace: 'nowrap' }}>{record.tanggal || '-'}</td>
                <td style={{ padding: '11px 10px', borderBottom: '1px solid #193328', fontWeight: 700, color: '#fff' }}>{record.nama_siswa || '-'}</td>
                <td style={{ padding: '11px 10px', borderBottom: '1px solid #193328' }}>{record.kelas || '-'}</td>
                <td style={{ padding: '11px 10px', borderBottom: '1px solid #193328' }}>{record.jenis_pelanggaran || '-'}</td>
                <td style={{ padding: '11px 10px', borderBottom: '1px solid #193328', color: '#34d399', fontWeight: 700 }}>{Number(record.poin || 0)}</td>
                <td style={{ padding: '11px 10px', borderBottom: '1px solid #193328' }}>{record.pencatat || '-'}</td>
                <td style={{ padding: '11px 10px', borderBottom: '1px solid #193328', whiteSpace: 'nowrap' }}>{record.sumber}</td>
                <td style={{ padding: '11px 10px', borderBottom: '1px solid #193328' }}>{record.keterangan || record.tindakan || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </>
  );
}