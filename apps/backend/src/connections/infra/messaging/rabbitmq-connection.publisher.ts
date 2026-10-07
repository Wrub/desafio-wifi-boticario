import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { CONNECTION_REGISTERED_PATTERN, type ConnectionRegisteredEvent } from '@wifi/contracts';
import {
  type ConnectionEventPublisher,
  EventPublishError,
} from '../../application/ports/connection-event.publisher.js';
import { WifiConnection } from '../../domain/wifi-connection.js';
import { RABBITMQ_CLIENT } from './rabbitmq.config.js';

@Injectable()
export class RabbitMqConnectionPublisher implements ConnectionEventPublisher {
  constructor(@Inject(RABBITMQ_CLIENT) private readonly client: ClientProxy) {}

  async publishRegistered(connection: WifiConnection): Promise<void> {
    const { device, visitor } = connection;
    const event: ConnectionRegisteredEvent = {
      id: connection.id,
      storeId: connection.storeId,
      connectedAt: connection.connectedAt.toISOString(),
      device: { macAddress: device.macAddress, type: device.type, os: device.os ?? undefined },
      visitor: {
        name: visitor.name,
        phone: visitor.phone.e164,
        cpf: visitor.cpf?.digits,
        email: visitor.email,
      },
    };

    try {
      await lastValueFrom(this.client.emit(CONNECTION_REGISTERED_PATTERN, event), {
        defaultValue: undefined,
      });
    } catch (error) {
      throw new EventPublishError(error);
    }
  }
}
