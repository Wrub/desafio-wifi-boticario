import type { DeviceType, Season } from '@wifi/contracts';
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

// máscaras dos campos do portal, aplicadas enquanto a pessoa digita
export function maskPhoneInput(value: string): string {
  let digits = value.replace(/\D/g, '');
  if (digits.length > 11 && digits.startsWith('55')) digits = digits.slice(2);
  digits = digits.slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function maskCpfInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
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

// índice = dia da semana que a API devolve (0 = domingo)
export const WEEKDAY_LABELS = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
];

export const SEASON_LABELS: Record<Season, string> = {
  verao: 'Verão',
  outono: 'Outono',
  inverno: 'Inverno',
  primavera: 'Primavera',
};

export function formatHour(hour: number): string {
  return `${hour}h`;
}
