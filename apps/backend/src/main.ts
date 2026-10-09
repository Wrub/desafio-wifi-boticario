import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { type MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module.js';
import { DatabaseUnavailableFilter } from './connections/infra/http/database-unavailable.filter.js';
import { DomainErrorFilter } from './connections/infra/http/domain-error.filter.js';
import { WIFI_CONNECTIONS_QUEUE } from './connections/infra/messaging/rabbitmq.config.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const frontendUrl = config.get<string>('FRONTEND_URL');
  app.enableCors({ origin: frontendUrl ? frontendUrl.split(',') : true });
  app.useGlobalFilters(
    new DatabaseUnavailableFilter(app.get(HttpAdapterHost).httpAdapter),
    new DomainErrorFilter(),
  );
  app.enableShutdownHooks();

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [config.getOrThrow<string>('RABBITMQ_URL')],
      queue: WIFI_CONNECTIONS_QUEUE,
      queueOptions: { durable: true },
      noAck: false,
      prefetchCount: 10,
    },
  });

  await app.startAllMicroservices();
  const port = Number(config.get('PORT', 3000));
  await app.listen(port, '0.0.0.0');
  Logger.log(`API rodando na porta ${port}`);
}
await bootstrap();
