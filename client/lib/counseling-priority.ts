export const PRIORITY_MARKER = '[SEGERA]';

const highRiskLanguage = /\b(bunuh diri|mengakhiri hidup|ingin mati|tidak ingin hidup|menyakiti diri|melukai diri|self[- ]harm|suicid(?:e|al)?|diancam|dipukul|dianiaya|kekerasan seksual|pelecehan seksual)\b/i;

export function isHighPriorityMessage(...values: Array<string | null | undefined>) {
  return values.some((value) => value?.includes(PRIORITY_MARKER) || highRiskLanguage.test(value || ''));
}

export function markPriorityTitle(title: string) {
  return title.includes(PRIORITY_MARKER) ? title : `${PRIORITY_MARKER} ${title}`;
}