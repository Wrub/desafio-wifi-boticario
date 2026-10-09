import { type ArgumentsHost, Catch, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import type { Response } from 'express';
import type { ApiError } from '@wifi/contracts';

// rede (host fora, conexão recusada/caída) e códigos do Postgres de banco desligando ou subindo
const UNAVAILABLE_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'ENOTFOUND',
  'EAI_AGAIN',
  'ETIMEDOUT',
  '57P01',
  '57P02',
  '57P03',
]);

export function isDatabaseUnavailable(error: unknown): boolean {
  // o QueryFailedError do TypeORM guarda o erro original do driver em driverError
  const candidates = [error, (error as { driverError?: unknown } | null)?.driverError];
  return candidates.some((candidate) => {
    if (!(candidate instanceof Error)) return false;
    const code = (candidate as { code?: unknown }).code;
    // classe 08 do Postgres = erro de conexão
    if (typeof code === 'string' && (UNAVAILABLE_CODES.has(code) || code.startsWith('08'))) {
      return true;
    }
    return /connection terminated/i.test(candidate.message);
  });
}

// Banco fora do ar vira 503 (igual ao RabbitMQ) em vez do 500 genérico; o resto segue o padrão do Nest.
@Catch()
export class DatabaseUnavailableFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(DatabaseUnavailableFilter.name);

  catch(error: unknown, host: ArgumentsHost) {
    if (!isDatabaseUnavailable(error)) {
      return super.catch(error, host);
    }

    this.logger.error('Banco de dados indisponível', error);
    const body: ApiError = {
      statusCode: 503,
      message: 'Serviço indisponível no momento, tente novamente',
    };
    host.switchToHttp().getResponse<Response>().status(body.statusCode).json(body);
  }
}
