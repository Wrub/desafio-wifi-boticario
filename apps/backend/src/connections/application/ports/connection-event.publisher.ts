import { WifiConnection } from '../../domain/wifi-connection.js';

export const CONNECTION_EVENT_PUBLISHER = Symbol('CONNECTION_EVENT_PUBLISHER');

export interface ConnectionEventPublisher {
  publishRegistered(connection: WifiConnection): Promise<void>;
}

// Quando não deu pra mandar pro broker, erro 503 na API
export class EventPublishError extends Error {
  constructor(cause: unknown) {
    super('não foi possível publicar o evento', { cause });
    this.name = 'EventPublishError';
  }
}
