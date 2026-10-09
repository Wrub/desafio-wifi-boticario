import type { Device } from '@wifi/contracts';

// no portal de verdade o MAC vem do roteador; aqui é aleatório e o tipo/sistema sai do user agent
export function simulatedDevice(userAgent: string = navigator.userAgent): Device {
  const mac = Array.from({ length: 6 }, () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, '0'),
  )
    .join(':')
    .toUpperCase();

  return { macAddress: mac, type: deviceType(userAgent), os: operatingSystem(userAgent) };
}

function deviceType(userAgent: string): Device['type'] {
  if (/iPad|Tablet/i.test(userAgent)) return 'tablet';
  if (/Mobi|iPhone|Android/i.test(userAgent)) return 'smartphone';
  if (/Windows|Macintosh|Linux/i.test(userAgent)) return 'laptop';
  return 'other';
}

function operatingSystem(userAgent: string): string | undefined {
  if (/iPhone|iPad/i.test(userAgent)) return 'iOS';
  if (/Android/i.test(userAgent)) return 'Android';
  if (/Windows/i.test(userAgent)) return 'Windows';
  if (/Macintosh/i.test(userAgent)) return 'macOS';
  if (/Linux/i.test(userAgent)) return 'Linux';
  return undefined;
}
