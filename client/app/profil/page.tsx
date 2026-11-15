'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  GraduationCap,
  KeyRound,
  Loader2,
  Mail,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';

type StudentProfile = {
  name: string;
  nisn: string;
  email: string;
  role: string;
  className: string;
  photoUrls: string[];
};

export default function StudentProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [photoIndex, setPhotoIndex] = useState(0);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw new Error(`Gagal memeriksa sesi akun: ${userError.message}`);
      if (!user) {
        router.replace('/');
        return;
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('role, display_name, student_record_id, kelas')
        .eq('user_id', user.id)
        .single();

      if (error) throw new Error(`Gagal memuat profil: ${error.message}`);
      if (!data || !['siswa', 'student'].includes(String(data.role).toLowerCase())) {
        throw new Error('Halaman ini hanya tersedia untuk akun siswa.');
      }

      let studentRecord: { nisn?: string | null; nama?: string | null; kelas?: string | null } | null = null;
      if (data.student_record_id) {
        const { data: studentData, error: studentError } = await supabase
          .from('users')
          .select('nisn, nama, kelas')
          .eq('id', data.student_record_id)
          .maybeSingle();

        if (studentError) throw new Error(`Gagal memuat data siswa: ${studentError.message}`);
        studentRecord = studentData;
      }

      const name = studentRecord?.nama || data.display_name || 'Siswa';
      const className = studentRecord?.kelas || data.kelas || 'Belum diatur';
      const photoUrls = className !== 'Belum diatur'
        ? ['JPG', 'jpg', 'JPEG', 'jpeg'].map((extension) =>
          supabase.storage
            .from('foto-siswa')
            .getPublicUrl(`${className}/${name}.${extension}`).data.publicUrl
        )
        : [];

      setProfile({
        name,
        nisn: studentRecord?.nisn || 'Belum tersedia',
        email: user.email || 'Email belum tersedia',
        role: 'Siswa',
        className,
        photoUrls,
      });
      setPhotoIndex(0);
    } catch (error: unknown) {
      console.error('Gagal memuat profil siswa:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Profil tidak dapat dimuat. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      try {
        const sessionValue = localStorage.getItem('user_session');
        if (sessionValue) {
          const session: unknown = JSON.parse(sessionValue);
          if (session && typeof session === 'object') {
            const account = session as Record<string, unknown>;
            const role = typeof account.role === 'string' ? account.role.toLowerCase() : '';
            if (role === 'siswa' || role === 'student') {
              setProfile({
                name: typeof account.nama === 'string' ? account.nama : 'Siswa',
                nisn: typeof account.nisn === 'string' ? account.nisn : 'Belum tersedia',
                email: typeof account.email === 'string' ? account.email : 'Email belum tersedia',
                role: 'Siswa',
                className: typeof account.kelas === 'string' ? account.kelas : 'Belum diatur',
                photoUrls: [],
              });
            }
          }
        }
      } catch (error: unknown) {
        console.error('Gagal membaca data sesi profil siswa:', error);
      }
      void loadProfile();
    }, 0);

    return () => window.clearTimeout(initialLoad);
  }, [loadProfile]);

  return (
    <div className="student-panel-page student-feature-refresh student-profile-page">
      <div className="student-profile-sidebar">
        <Sidebar />
      </div>
      <div className="student-profile-shell">
        <header className="student-profile-topbar">
          <div className="student-profile-topbar-title">
            <span><UserRound size={17} /></span>
            <h1>Profil Saya</h1>
            <code>/profil</code>
          </div>
          <div className="student-profile-welcome">
            <Sparkles size={14} />
            <span>Selamat datang, <strong>{profile?.name || 'Siswa'}</strong></span>
          </div>
        </header>
        <main className="student-profile-content">
          <header className="student-profile-page-heading">
            <div>
              <span className="student-profile-eyebrow"><ShieldCheck size={14} /> RUANG PERSONAL</span>
              <h1>Profil Saya</h1>
              <p>Informasi akunmu di MindGuard, tersimpan dengan aman.</p>
            </div>
            <button type="button" onClick={() => void loadProfile()} disabled={isLoading} className="student-profile-refresh">
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              Muat ulang
            </button>
          </header>

          {isLoading && !profile ? (
            <section className="student-profile-state" role="status">
              <Loader2 size={24} className="animate-spin" />
              <span>Sedang menyiapkan profilmu...</span>
            </section>
          ) : !profile && errorMessage ? (
            <section className="student-profile-state is-error" role="alert">
              <p>{errorMessage}</p>
              <button type="button" onClick={() => void loadProfile()}>Coba lagi</button>
            </section>
          ) : profile ? (
            <>
              {errorMessage && (
                <p className="student-profile-load-warning" role="status">
                  Data akun dasar ditampilkan. Sebagian detail belum dapat diperbarui saat ini.
                </p>
              )}
              <section className="student-profile-hero">
                <div className="student-profile-avatar" aria-hidden="true">
                  {profile.photoUrls[photoIndex] ? (
                    <Image
                      src={profile.photoUrls[photoIndex]}
                      alt=""
                      width={82}
                      height={82}
                      unoptimized
                      onError={() => setPhotoIndex((current) => current + 1)}
                    />
                  ) : (
                    <UserRound size={42} />
                  )}
                  <span><BadgeCheck size={15} /></span>
                </div>
                <div className="student-profile-identity">
                  <span className="student-profile-role">{profile.role} MindGuard</span>
                  <h2>{profile.name}</h2>
                  <p>{profile.email}</p>
                </div>
                <div className="student-profile-private"><ShieldCheck size={16} /> Akun terlindungi</div>
              </section>

              <div className="student-profile-grid">
                <section className="student-profile-info-card">
                  <div className="student-profile-card-heading">
                    <span className="student-profile-card-icon"><GraduationCap size={19} /></span>
                    <div>
                      <h2>Info siswa</h2>
                      <p>Ringkasan identitas sekolahmu</p>
                    </div>
                  </div>
                  <div className="student-profile-info-row">
                    <span>Nama lengkap</span>
                    <strong>{profile.name}</strong>
                  </div>
                  <div className="student-profile-info-row">
                    <span>NISN</span>
                    <strong>{profile.nisn}</strong>
                  </div>
                  <div className="student-profile-info-row">
                    <span>Kelas</span>
                    <strong>{profile.className}</strong>
                  </div>
                  <div className="student-profile-info-row">
                    <span>Peran akun</span>
                    <strong>{profile.role}</strong>
                  </div>
                </section>

                <section className="student-profile-info-card student-profile-account-card">
                  <div className="student-profile-card-heading">
                    <span className="student-profile-card-icon is-blue"><Mail size={18} /></span>
                    <div>
                      <h2>Akses akun</h2>
                      <p>Jaga akun tetap bisa kamu akses</p>
                    </div>
                  </div>
                  <div className="student-profile-info-row">
                    <span>Email akun</span>
                    <strong className="student-profile-email">{profile.email}</strong>
                  </div>
                  <Link href="/akun/email" className="student-profile-action">
                    <span><KeyRound size={16} /> Kelola email pemulihan</span>
                    <ArrowRight size={16} />
                  </Link>
                </section>
              </div>

              <div className="student-profile-bottom-link">
                <Link href="/dashboard"><ArrowLeft size={16} /> Kembali ke beranda</Link>
                <span>SMK Budi Bakti Ciwidey</span>
              </div>
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}
