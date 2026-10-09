import { Controller, Inject, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import type { Channel, Message } from 'amqplib';
import { CONNECTION_REGISTERED_PATTERN, connectionRegisteredEventSchema } from '@wifi/contracts';
import { SaveConnection } from '../../application/use-cases/save-connection.js';
import { DomainError } from '../../domain/domain.error.js';

const RETRY_DELAY_MS = 2_000;

// ack manual: a mensagem só sai da fila depois de gravada no banco
@Controller()
export class ConnectionRegisteredConsumer {
  private readonly logger = new Logger(ConnectionRegisteredConsumer.name);

  constructor(@Inject(SaveConnection) private readonly saveConnection: SaveConnection) {}

  // o <string> é pra cair no overload sem tipagem, senão o Nest 12 reclama do RmqContext
  @EventPattern<string>(CONNECTION_REGISTERED_PATTERN)
  async handle(@Payload() payload: unknown, @Ctx() context: RmqContext): Promise<void> {
    const channel = context.getChannelRef() as Channel;
    const message = context.getMessage() as Message;

    const parsed = connectionRegisteredEventSchema.safeParse(payload);
    if (!parsed.success) {
      // mensagem quebrada nunca vai dar certo, descarto em vez de ficar tentando pra sempre
      this.logger.warn(`Mensagem inválida descartada: ${parsed.error.message}`);
      channel.nack(message, false, false);
      return;
    }

    const event = parsed.data;
    try {
      await this.saveConnection.execute({ ...event, connectedAt: new Date(event.connectedAt) });
      channel.ack(message);
    } catch (error) {
      if (error instanceof DomainError) {
        this.logger.warn(`Conexão ${event.id} descartada: ${error.message}`);
        channel.nack(message, false, false);
        return;
      }
      // provavelmente o banco caiu: espero um pouco e devolvo pra fila
      this.logger.error(`Falha ao salvar conexão ${event.id}, voltando pra fila`, error);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      channel.nack(message, false, true);
    }
  }
}
