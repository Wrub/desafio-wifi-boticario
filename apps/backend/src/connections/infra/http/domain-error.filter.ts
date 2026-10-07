import { type ArgumentsHost, Catch, type ExceptionFilter, Logger } from '@nestjs/common';
import type { Response } from 'express';
import type { ApiError } from '@wifi/contracts';
import { DomainError, NotFoundError } from '../../domain/domain.error.js';
import { EventPublishError } from '../../application/ports/connection-event.publisher.js';

// Converte erro das camadas de dentro em resposta HTTP.
// Domínio e casos de uso não sabem o que é status code, só lançam o erro.
@Catch(DomainError, EventPublishError)
export class DomainErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainErrorFilter.name);

  catch(error: DomainError | EventPublishError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    let body: ApiError;
    if (error instanceof NotFoundError) {
      body = { statusCode: 404, message: error.message };
    } else if (error instanceof DomainError) {
      body = { statusCode: 400, message: error.message };
    } else {
      this.logger.error('RabbitMQ indisponível', error.cause);
      body = { statusCode: 503, message: 'Serviço indisponível no momento, tente novamente' };
    }

    response.status(body.statusCode).json(body);
  }
}
