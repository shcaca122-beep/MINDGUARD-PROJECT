import { ShieldCheck } from 'lucide-react';

export default function Loading() {
  return (
    <main className="mindguard-loading-page" role="status" aria-live="polite">
      <div className="mindguard-loading-orbit mindguard-loading-orbit-one" />
      <div className="mindguard-loading-orbit mindguard-loading-orbit-two" />
      <div className="mindguard-loading-mascot" aria-hidden="true">
        <span className="mindguard-loading-leaf mindguard-loading-leaf-left" />
        <span className="mindguard-loading-leaf mindguard-loading-leaf-right" />
        <span className="mindguard-loading-face">
          <i />
          <i />
          <b />
        </span>
      </div>
      <div className="mindguard-loading-brand">
        <ShieldCheck size={19} />
        <span>mindguard<span>.</span></span>
      </div>
      <p>Sedang menyiapkan ruangmu</p>
      <div className="mindguard-loading-dots" aria-label="Memuat">
        <i />
        <i />
        <i />
      </div>
    </main>
  );
}
