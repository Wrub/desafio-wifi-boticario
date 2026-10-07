import { BadRequestException, type PipeTransform } from '@nestjs/common';
import type { z, ZodType } from 'zod';
import type { ApiError } from '@wifi/contracts';

export class ZodValidationPipe<T extends ZodType> implements PipeTransform {
  constructor(private readonly schema: T) {}

  transform(value: unknown): z.output<T> {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const body: ApiError = {
        statusCode: 400,
        message: 'Dados inválidos',
        issues: result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      };
      throw new BadRequestException(body);
    }
    return result.data;
  }
}
