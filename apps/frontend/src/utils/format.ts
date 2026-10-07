import type { DeviceType } from '@wifi/contracts';

export const DEVICE_LABELS: Record<DeviceType, string> = {
  smartphone: 'Celular',
  tablet: 'Tablet',
  laptop: 'Notebook',
  other: 'Outro',
};

const dateTime = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso));
}

// "São Paulo" e "sao paulo" viram a mesma coisa na busca
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function formatNumber(value: number, maximumFractionDigits = 0): string {
  return value.toLocaleString('pt-BR', { maximumFractionDigits });
}
