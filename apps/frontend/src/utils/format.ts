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

// "+5541999998888" -> "(41) 99999-8888"
export function formatPhone(e164: string): string {
  const digits = e164.replace(/^\+55/, '');
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
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
