import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';

import { env } from '@erp/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: true,
      load: [() => env],
    }),

    LoggerModule.forRoot({
      pinoHttp: {
        level: env.NODE_ENV === 'production' ? 'info' : 'debug',
        transport:
          env.NODE_ENV === 'development'
            ? {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  translateTime: 'SYS:standard',
                  singleLine: true,
                },
              }
            : undefined,
      },
    }),

    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
