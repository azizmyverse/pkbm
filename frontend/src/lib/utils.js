import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatTanggal(date, withTime = false) {
  if (!date) return '-';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '-';
  const opts = { day: 'numeric', month: 'short', year: 'numeric' };
  if (withTime) {
    opts.hour = '2-digit';
    opts.minute = '2-digit';
  }
  return d.toLocaleDateString('id-ID', opts);
}

export function formatRelatif(date) {
  if (!date) return '-';
  const d = new Date(date);
  const diffMs = Date.now() - d.getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return 'Baru saja';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} menit lalu`;
  const jam = Math.floor(min / 60);
  if (jam < 24) return `${jam} jam lalu`;
  const hari = Math.floor(jam / 24);
  if (hari < 7) return `${hari} hari lalu`;
  return formatTanggal(date);
}

export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('');
}

export const ROLE_LABEL = {
  ADMIN: 'Admin',
  GURU: 'Guru',
  SISWA: 'Siswa',
};

export const PAKET_LABEL = {
  PAKET_A: 'Paket A',
  PAKET_B: 'Paket B',
  PAKET_C: 'Paket C',
};

export function paketColor(level) {
  if (level === 'PAKET_A') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300';
  if (level === 'PAKET_B') return 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300';
  if (level === 'PAKET_C') return 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300';
  return 'bg-muted text-foreground';
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
