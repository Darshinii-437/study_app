import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import confetti from 'canvas-confetti';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string | undefined): string {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
}

export function formatDateTime(dateString: string | undefined): string {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTimeAgo(dateString: string | undefined): string {
  if (!dateString) return '';
  const d = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return formatDate(dateString);
}

export function isOverdue(dateString: string | undefined): boolean {
  if (!dateString) return false;
  const d = new Date(dateString);
  const now = new Date();
  return d.getTime() < now.getTime();
}

export function isDueSoon(dateString: string | undefined, hours = 48): boolean {
  if (!dateString) return false;
  const d = new Date(dateString);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  return diffMs > 0 && diffMs <= hours * 60 * 60 * 1000;
}

export function triggerConfetti() {
  try {
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#10b981', '#3b82f6', '#6366f1', '#f59e0b'],
    });
  } catch (err) {
    // fallback if canvas not available
  }
}
