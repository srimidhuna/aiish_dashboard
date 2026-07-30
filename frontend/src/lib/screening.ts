import type { Screening } from '../types';

/** Derives a short display label for which tests were performed on a screening record. */
export function getScreeningTypeLabel(s: Screening): string {
  const parts: string[] = [];
  if (s.boaResult) parts.push('BOA');
  if (s.teoaeRight || s.teoaeLeft) parts.push('TEOAE');
  if (s.dpoaeRight || s.dpoaeLeft) parts.push('DPOAE');
  if (s.aabr1Right || s.aabr1Left) parts.push('AABR-1');
  if (s.aabr2Right || s.aabr2Left) parts.push('AABR-2');
  return parts.length > 0 ? parts.join(' / ') : 'Screening';
}
