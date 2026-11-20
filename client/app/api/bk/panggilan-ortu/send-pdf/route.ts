import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { generateParentCallPdf } from '@/lib/parent-call-pdf';

export const runtime = 'nodejs';

type ParentCallRecord = {
  id: string | number;
  nama_siswa: string | null;
  kelas: string | null;
  keperluan: string | null;
  alasan: string | null;
  tanggal: string | null;
  pukul: string | null;
  parent_phone: string | null;
};

function getWhatsAppPhone(rawPhone: string): string | null {
  let phone = rawPhone.replace(/\D/g, '');
  if (phone.startsWith('0')) phone = `62${phone.slice(1)}`;
  if (phone.length < 10 || phone.length > 15) return null;
  return phone;
}

async function getMetaError(response: Response): Promise<string> {
  const body: unknown = await response.json().catch(() => null);
  if (body && typeof body === 'object') {
    const error = (body as { error?: { code?: number; message?: string } }).error;
    if (error?.code === 131047) {
      return 'WhatsApp tidak dapat mengirim PDF langsung karena percakapan sudah di luar jendela 24 jam. Minta orang tua mengirim pesan WhatsApp ke nomor sekolah, lalu coba lagi.';
    }
    if (error?.message) return error.message;
  }
  return `WhatsApp Cloud API gagal (HTTP ${response.status}).`;
}

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const graphApiVersion = process.env.WHATSAPP_GRAPH_API_VERSION;

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return NextResponse.json({ error: 'Konfigurasi Supabase server belum lengkap.' }, { status: 503 });
    }
    if (!accessToken || !phoneNumberId || !graphApiVersion) {
      return NextResponse.json(
        { error: 'WhatsApp Cloud API belum dikonfigurasi. Isi token, phone number ID, dan versi Graph API di environment server.' },
        { status: 503 },
      );
    }

    const cookieStore = await cookies();
    const sessionClient = createServerClient(supabaseUrl, anonKey, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (values) => values.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    });
    const { data: { user }, error: authError } = await sessionClient.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Sesi login tidak valid. Silakan masuk kembali.' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await sessionClient
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    if (profileError || !['admin', 'bk'].includes(profile?.role || '')) {
      return NextResponse.json({ error: 'Hanya Administrator dan Guru BK yang dapat mengirim surat.' }, { status: 403 });
    }

    const body: unknown = await request.json();
    const callId = body && typeof body === 'object'
      ? String((body as Record<string, unknown>).callId || '').trim()
      : '';
    const namaGuruBK = body && typeof body === 'object'
      ? String((body as Record<string, unknown>).namaGuruBK || '').trim().slice(0, 120)
      : '';
    const requestedPhone = body && typeof body === 'object'
      ? String((body as Record<string, unknown>).parentPhone || '').trim()
      : '';
    if (!callId) {
      return NextResponse.json({ error: 'ID surat panggilan tidak tersedia.' }, { status: 400 });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: callRecord, error: callError } = await adminClient
      .from('panggilan_ortu')
      .select('id,nama_siswa,kelas,keperluan,alasan,tanggal,pukul,parent_phone')
      .eq('id', callId)
      .single();
    if (callError || !callRecord) {
      console.error('Gagal mengambil surat untuk dikirim:', callError?.message);
      return NextResponse.json(
        { error: callError?.message.includes('parent_phone')
          ? 'Kolom nomor wali belum terbaca. Terapkan migrasi database dan muat ulang schema Supabase.'
          : 'Data surat panggilan tidak ditemukan atau gagal dibaca.' },
        { status: 404 },
      );
    }

    const record = callRecord as ParentCallRecord;
    const phone = getWhatsAppPhone(requestedPhone || record.parent_phone || '');
    if (!phone) {
      return NextResponse.json({ error: 'Nomor WhatsApp orang tua belum diisi atau formatnya tidak valid.' }, { status: 400 });
    }

    const { data: allCalls, error: sequenceError } = await adminClient
      .from('panggilan_ortu')
      .select('id')
      .order('created_at', { ascending: true })
      .limit(5000);
    if (sequenceError) {
      console.error('Gagal menentukan nomor surat:', sequenceError.message);
      return NextResponse.json({ error: 'Nomor surat gagal ditentukan. Coba lagi.' }, { status: 500 });
    }
    const index = (allCalls || []).findIndex((item) => String(item.id) === String(record.id));
    const nomorSurat = String(index >= 0 ? index + 1 : 1).padStart(3, '0');

    const pdf = await generateParentCallPdf({
      namaSiswa: record.nama_siswa || 'Siswa',
      kelas: record.kelas || '-',
      keperluan: record.keperluan || record.alasan || 'Konsultasi Pelanggaran & Pembinaan Siswa',
      tanggal: record.tanggal || '',
      pukul: record.pukul || '09:00',
      nomorSurat,
      namaGuruBK,
    });
    if (pdf.byteLength > 15 * 1024 * 1024) {
      return NextResponse.json({ error: 'PDF surat melebihi batas ukuran yang didukung.' }, { status: 413 });
    }

    const cleanName = (record.nama_siswa || 'siswa').replace(/[^\p{L}\p{N}-]+/gu, '_');
    const fileName = `Surat_Panggilan_Ortu_${cleanName}.pdf`;
    const mediaForm = new FormData();
    mediaForm.append('messaging_product', 'whatsapp');
    mediaForm.append('type', 'application/pdf');
    mediaForm.append('file', new Blob([new Uint8Array(pdf)], { type: 'application/pdf' }), fileName);

    const graphBase = `https://graph.facebook.com/${graphApiVersion}/${phoneNumberId}`;
    const uploadResponse = await fetch(`${graphBase}/media`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: mediaForm,
    });
    if (!uploadResponse.ok) {
      return NextResponse.json({ error: await getMetaError(uploadResponse) }, { status: 502 });
    }

    const uploadResult = await uploadResponse.json() as { id?: string };
    if (!uploadResult.id) {
      return NextResponse.json({ error: 'WhatsApp tidak mengembalikan ID dokumen PDF.' }, { status: 502 });
    }

    const sendResponse = await fetch(`${graphBase}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phone,
        type: 'document',
        document: {
          id: uploadResult.id,
          filename: fileName,
          caption: `Surat panggilan orang tua/wali untuk ${record.nama_siswa || 'siswa'}.`,
        },
      }),
    });
    if (!sendResponse.ok) {
      return NextResponse.json({ error: await getMetaError(sendResponse) }, { status: 502 });
    }

    const sendResult = await sendResponse.json() as { messages?: Array<{ id?: string }> };
    return NextResponse.json({
      success: true,
      messageId: sendResult.messages?.[0]?.id || null,
    });
  } catch (error) {
    console.error('Gagal mengirim PDF surat melalui WhatsApp:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Pengiriman PDF melalui WhatsApp gagal.' },
      { status: 500 },
    );
  }
}
