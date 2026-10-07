import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConnectionsModule } from './connections/connections.module.js';
import { HealthController } from './health.controller.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        // se tiver DATABASE_URL ela ganha (Neon e afins dão só a URL)
        url: config.get<string>('DATABASE_URL'),
        host: config.get<string>('DATABASE_HOST', 'localhost'),
        port: Number(config.get('DATABASE_PORT', 5432)),
        username: config.get<string>('DATABASE_USER', 'wifi'),
        password: config.get<string>('DATABASE_PASSWORD', 'wifi'),
        database: config.get<string>('DATABASE_NAME', 'wifi'),
        ssl: config.get('DATABASE_SSL') === 'true' ? { rejectUnauthorized: false } : false,
        autoLoadEntities: true,
        // cria as tabelas sozinho. Pro desafio serve, em produção o certo é migration
        synchronize: config.get('DB_SYNC') === 'true',
      }),
    }),
    ConnectionsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
