'use client';

import { useSyncExternalStore } from 'react';
import { WifiOff } from 'lucide-react';

function subscribeToConnection(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);

  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getConnectionSnapshot() {
  return navigator.onLine;
}

export default function ConnectionStatus() {
  const isOnline = useSyncExternalStore(subscribeToConnection, getConnectionSnapshot, () => true);

  if (isOnline) return null;

  return (
    <div className="mindguard-connection-status is-offline" role="status" aria-live="polite">
      <span className="mindguard-connection-icon">
        <WifiOff size={17} />
      </span>
      <span>
        <strong>Koneksi internet terputus</strong>
        <small>Periksa internetmu. Notifikasi ini akan hilang saat koneksi pulih.</small>
      </span>
      <span className="mindguard-connection-pulse" aria-hidden="true" />
    </div>
  );
}
