import type { ArgumentsHost } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { InvalidConnectionError } from '../../domain/domain.error.js';
import { DatabaseUnavailableFilter, isDatabaseUnavailable } from './database-unavailable.filter.js';

function networkError(code: string, message = `connect ${code}`) {
  return Object.assign(new Error(message), { code });
}

// mesmo formato do QueryFailedError do TypeORM: o erro do pg fica em driverError
function queryFailed(code: string) {
  return Object.assign(new Error('query failed'), { driverError: networkError(code) });
}

describe('isDatabaseUnavailable', () => {
  it.each([
    ['host não encontrado', networkError('ENOTFOUND')],
    ['conexão recusada', networkError('ECONNREFUSED')],
    ['timeout', networkError('ETIMEDOUT')],
    ['banco desligando (57P01)', queryFailed('57P01')],
    ['falha de conexão do Postgres (08006)', queryFailed('08006')],
    ['conexão caiu no meio', new Error('Connection terminated unexpectedly')],
  ])('reconhece %s', (_, error) => {
    expect(isDatabaseUnavailable(error)).toBe(true);
  });

  it.each([
    ['erro de domínio', new InvalidConnectionError('CPF inválido')],
    ['erro HTTP', new BadRequestException()],
    ['violação de constraint (23505)', queryFailed('23505')],
    ['bug qualquer', new TypeError('x is undefined')],
    ['valor que não é erro', 'falhou'],
    ['null', null],
  ])('não confunde com %s', (_, error) => {
    expect(isDatabaseUnavailable(error)).toBe(false);
  });
});

describe('DatabaseUnavailableFilter', () => {
  it('responde 503 com mensagem em português quando o banco está fora', () => {
    const response = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const host = {
      switchToHttp: () => ({ getResponse: () => response }),
    } as unknown as ArgumentsHost;

    new DatabaseUnavailableFilter().catch(networkError('ENOTFOUND'), host);

    expect(response.status).toHaveBeenCalledWith(503);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: 503,
      message: 'Serviço indisponível no momento, tente novamente',
    });
  });
});
