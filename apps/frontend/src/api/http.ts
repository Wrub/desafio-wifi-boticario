import { apiErrorSchema, type ApiError } from '@wifi/contracts';
import type { ZodType } from 'zod';

export type Period = { from: Date; to: Date };

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly issues?: ApiError['issues'],
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

export async function requestJson<T>(
  url: string,
  schema: ZodType<T>,
  signal?: AbortSignal,
  init?: RequestInit,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { ...init, signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiRequestError('Não foi possível conectar ao servidor.');
  }

  const body: unknown = await response.json().catch(() => undefined);

  if (!response.ok) {
    const apiError = apiErrorSchema.safeParse(body);
    throw new ApiRequestError(
      apiError.success ? apiError.data.message : `Erro inesperado (HTTP ${response.status}).`,
      response.status,
      apiError.success ? apiError.data.issues : undefined,
    );
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    console.error('Resposta fora do contrato', parsed.error);
    throw new ApiRequestError('O servidor respondeu em um formato inesperado.');
  }
  return parsed.data;
}

export function periodParams({ from, to }: Period): URLSearchParams {
  return new URLSearchParams({ from: from.toISOString(), to: to.toISOString() });
}
