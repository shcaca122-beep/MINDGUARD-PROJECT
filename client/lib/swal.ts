import Swal from 'sweetalert2';

// POP-UP SUKSES (Tema Hijau MindGuard)
export const showSuccess = (title: string, text: string) => {
  Swal.fire({
    title,
    text,
    icon: 'success',
    confirmButtonColor: '#1b3b2b',
    confirmButtonText: 'Siap, Mengerti',
    background: '#ffffff',
    color: '#1f2937',
  });
};

// POP-UP ERROR / GAGAL
export const showError = (title: string, text: string) => {
  Swal.fire({
    title,
    text,
    icon: 'error',
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'Coba Lagi',
    background: '#ffffff',
    color: '#1f2937',
  });
};