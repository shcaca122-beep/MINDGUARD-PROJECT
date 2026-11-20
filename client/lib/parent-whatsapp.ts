export function createParentWhatsAppUrl(phone: string | null | undefined, message: string): string | null {
  const trimmedPhone = String(phone || '').trim();
  let normalizedPhone = trimmedPhone.replace(/\D/g, '');

  if (normalizedPhone.startsWith('0')) {
    normalizedPhone = `62${normalizedPhone.slice(1)}`;
  } else if (trimmedPhone.startsWith('+')) {
    normalizedPhone = trimmedPhone.replace(/\D/g, '');
  }

  if (normalizedPhone.length < 10 || normalizedPhone.length > 15) return null;

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}
