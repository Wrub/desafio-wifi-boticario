import { randomUUID } from 'node:crypto';
import type { DeviceProps } from '../../domain/device.js';
import { InvalidConnectionError } from '../../domain/domain.error.js';
import type { VisitorProps } from '../../domain/visitor.js';
import { WifiConnection } from '../../domain/wifi-connection.js';
import type { ConnectionEventPublisher } from '../ports/connection-event.publisher.js';
import type { ConnectionRepository } from '../ports/connection.repository.js';

export interface RequestConnectionRegistrationInput {
  storeId: string;
  device: DeviceProps;
  visitor: VisitorProps;
  connectedAt?: Date;
}

// Chamado pelo POST /connections. Valida e joga na fila, sem gravar no banco,
export class RequestConnectionRegistration {
  constructor(
    private readonly publisher: ConnectionEventPublisher,
    private readonly repository: ConnectionRepository,
    private readonly generateId: () => string = randomUUID,
  ) {}

  async execute(input: RequestConnectionRegistrationInput): Promise<{ id: string }> {
    const connection = WifiConnection.create({
      id: this.generateId(),
      storeId: input.storeId,
      connectedAt: input.connectedAt ?? new Date(),
      device: input.device,
      visitor: input.visitor,
    });

    if (!(await this.repository.storeExists(connection.storeId))) {
      throw new InvalidConnectionError(`loja ${connection.storeId} não existe`);
    }

    await this.publisher.publishRegistered(connection);
    return { id: connection.id };
  }
}
