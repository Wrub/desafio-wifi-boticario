import { Device, type DeviceProps } from './device.js';
import { InvalidConnectionError } from './domain.error.js';
import { Visitor, type VisitorProps } from './visitor.js';

// margem pra relógio do roteador um pouco adiantado
const CLOCK_SKEW_MS = 60_000;

export interface WifiConnectionProps {
  id: string;
  storeId: string;
  connectedAt: Date;
  device: DeviceProps;
  visitor: VisitorProps;
}

export class WifiConnection {
  private constructor(
    readonly id: string,
    readonly storeId: string,
    readonly connectedAt: Date,
    readonly device: Device,
    readonly visitor: Visitor,
  ) {}

  static create(props: WifiConnectionProps, now: Date = new Date()): WifiConnection {
    const storeId = props.storeId.trim();
    if (!storeId) {
      throw new InvalidConnectionError('storeId é obrigatório');
    }
    if (Number.isNaN(props.connectedAt.getTime())) {
      throw new InvalidConnectionError('connectedAt não é uma data válida');
    }
    if (props.connectedAt.getTime() > now.getTime() + CLOCK_SKEW_MS) {
      throw new InvalidConnectionError('connectedAt não pode estar no futuro');
    }

    return new WifiConnection(
      props.id,
      storeId,
      props.connectedAt,
      Device.create(props.device),
      Visitor.create(props.visitor),
    );
  }
}
