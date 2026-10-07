import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  CONNECTION_EVENT_PUBLISHER,
  type ConnectionEventPublisher,
} from './application/ports/connection-event.publisher.js';
import {
  CONNECTION_REPOSITORY,
  type ConnectionRepository,
} from './application/ports/connection.repository.js';
import { GetVisitsSummary } from './application/use-cases/get-visits-summary.js';
import { ListStoreVisitors } from './application/use-cases/list-store-visitors.js';
import { ListStores } from './application/use-cases/list-stores.js';
import { RequestConnectionRegistration } from './application/use-cases/request-connection-registration.js';
import { SaveConnection } from './application/use-cases/save-connection.js';
import { ConnectionsController } from './infra/http/connections.controller.js';
import { MetricsController } from './infra/http/metrics.controller.js';
import { StoresController } from './infra/http/stores.controller.js';
import { ConnectionRegisteredConsumer } from './infra/messaging/connection-registered.consumer.js';
import { RabbitMqConnectionPublisher } from './infra/messaging/rabbitmq-connection.publisher.js';
import { RABBITMQ_CLIENT, WIFI_CONNECTIONS_QUEUE } from './infra/messaging/rabbitmq.config.js';
import { StoreOrmEntity } from './infra/persistence/store.orm-entity.js';
import { DemoDataSeed } from './infra/persistence/seed/demo-data.seed.js';
import { TypeOrmConnectionRepository } from './infra/persistence/typeorm-connection.repository.js';
import { VisitorOrmEntity } from './infra/persistence/visitor.orm-entity.js';
import { WifiConnectionOrmEntity } from './infra/persistence/wifi-connection.orm-entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([StoreOrmEntity, VisitorOrmEntity, WifiConnectionOrmEntity]),
    ClientsModule.registerAsync([
      {
        name: RABBITMQ_CLIENT,
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [config.getOrThrow<string>('RABBITMQ_URL')],
            queue: WIFI_CONNECTIONS_QUEUE,
            queueOptions: { durable: true },
            persistent: true,
          },
        }),
      },
    ]),
  ],
  controllers: [
    ConnectionsController,
    MetricsController,
    StoresController,
    ConnectionRegisteredConsumer,
  ],
  providers: [
    DemoDataSeed,

    { provide: CONNECTION_REPOSITORY, useClass: TypeOrmConnectionRepository },
    { provide: CONNECTION_EVENT_PUBLISHER, useClass: RabbitMqConnectionPublisher },

    {
      provide: RequestConnectionRegistration,
      inject: [CONNECTION_EVENT_PUBLISHER, CONNECTION_REPOSITORY],
      useFactory: (publisher: ConnectionEventPublisher, repository: ConnectionRepository) =>
        new RequestConnectionRegistration(publisher, repository),
    },
    {
      provide: SaveConnection,
      inject: [CONNECTION_REPOSITORY],
      useFactory: (repository: ConnectionRepository) => new SaveConnection(repository),
    },
    {
      provide: GetVisitsSummary,
      inject: [CONNECTION_REPOSITORY],
      useFactory: (repository: ConnectionRepository) => new GetVisitsSummary(repository),
    },
    {
      provide: ListStores,
      inject: [CONNECTION_REPOSITORY],
      useFactory: (repository: ConnectionRepository) => new ListStores(repository),
    },
    {
      provide: ListStoreVisitors,
      inject: [CONNECTION_REPOSITORY],
      useFactory: (repository: ConnectionRepository) => new ListStoreVisitors(repository),
    },
  ],
})
export class ConnectionsModule {}
