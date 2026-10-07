import { InvalidConnectionError } from './domain.error.js';

export type DeviceType = 'smartphone' | 'tablet' | 'laptop' | 'other';

const DEVICE_TYPES: DeviceType[] = ['smartphone', 'tablet', 'laptop', 'other'];
const MAC_REGEX = /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/;

export interface DeviceProps {
  macAddress: string;
  type: string;
  os?: string | null;
}

export class Device {
  private constructor(
    readonly macAddress: string,
    readonly type: DeviceType,
    readonly os: string | null,
  ) {}

  static create(props: DeviceProps): Device {
    // padroniza macAddress para o formato AA:BB:CC:DD:EE:FF
    const macAddress = props.macAddress.trim().toUpperCase().replaceAll('-', ':');
    if (!MAC_REGEX.test(macAddress)) {
      throw new InvalidConnectionError(`MAC inválido: ${props.macAddress}`);
    }
    if (!DEVICE_TYPES.includes(props.type as DeviceType)) {
      throw new InvalidConnectionError(`tipo de aparelho inválido: ${props.type}`);
    }
    return new Device(macAddress, props.type as DeviceType, props.os?.trim() || null);
  }
}
