import type { DeviceType } from '@wifi/contracts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

// ex: "sábado 18:30", no fuso de quem está vendo
export function formatWeekdayTime(iso: string): string {
  return format(new Date(iso), 'EEE HH:mm', { locale: ptBR });
}

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
