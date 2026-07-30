import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function formatAge(dob: string): string {
  const diff = Date.now() - new Date(dob).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 30) return `${days} days`;
  const months = Math.floor(days / 30);
  return `${months} months`;
}
