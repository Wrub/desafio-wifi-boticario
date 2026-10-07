import { Body, Controller, HttpCode, HttpStatus, Inject, Post } from '@nestjs/common';
import {
  registerConnectionSchema,
  type RegisterConnectionRequest,
  type RegisterConnectionResponse,
} from '@wifi/contracts';
import { RequestConnectionRegistration } from '../../application/use-cases/request-connection-registration.js';
import { ZodValidationPipe } from './zod-validation.pipe.js';

@Controller('connections')
export class ConnectionsController {
  constructor(
    @Inject(RequestConnectionRegistration)
    private readonly requestRegistration: RequestConnectionRegistration,
  ) {}

  // 202: a conexão entra na fila agora e é gravada logo depois pelo consumer
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  register(
    @Body(new ZodValidationPipe(registerConnectionSchema)) body: RegisterConnectionRequest,
  ): Promise<RegisterConnectionResponse> {
    return this.requestRegistration.execute({
      storeId: body.storeId,
      device: body.device,
      visitor: body.visitor,
      connectedAt: body.connectedAt ? new Date(body.connectedAt) : undefined,
    });
  }
}
