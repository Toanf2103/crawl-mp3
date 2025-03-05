import { ZodValidationPipe } from '@anatine/zod-nestjs';
import { CACHE_MANAGER, CacheInterceptor, CacheManagerOptions, CacheModule } from '@nestjs/cache-manager';
import {
  Inject,
  Injectable,
  Logger,
  MiddlewareConsumer,
  Module,
  NestMiddleware,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { FastifyReply, FastifyRequest } from 'fastify';
import { WINSTON_MODULE_PROVIDER, WinstonModule } from 'nest-winston';
import { parse } from 'qs';
import { format } from 'winston';
import { StaticController } from './static/static.controller';

import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { Cache } from 'cache-manager';
import bullConfig from './config/bull.config';
import redisConfig from './config/redis.config';
import { appConfig } from './modules/base/config';
import { ExistsConstraint } from './modules/base/validators/exist.validator';
import { IsSameAsConstraint } from './modules/base/validators/is-same-as.validator';
import { IsUniqueConstraint } from './modules/base/validators/is-unique.validator';
import { LandingModule } from './modules/landing/landing.module';

const DailyRotateFile = require('winston-daily-rotate-file');
const MODIFIABLE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];
const BASIC_METHODS = MODIFIABLE_METHODS.concat(['GET']);

@Injectable()
class LoggerMiddleware implements NestMiddleware {
  private readonly nestLogger = new Logger(LoggerMiddleware.name);
  private readonly regexPrefix = /cms|landing/i;
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly fileLogger: Logger,
  ) {}

  use(req: FastifyRequest, res: FastifyReply['raw'], next: () => any) {
    const start = Date.now();
    const isModifiable = MODIFIABLE_METHODS.includes(req.method);
    if (isModifiable && !req.body) {
      req.body = {};
    }

    if (req.method === 'GET' && req.originalUrl.split('/').pop() === 'export') {
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=export-${Date.now()}.xlsx`);
    }
    res.on('close', async () => {
      if (req.originalUrl.startsWith('/static')) {
        return;
      }

      if (BASIC_METHODS.includes(req.method)) {
        const message = `${req.method} ${req.originalUrl} (${Date.now() - start} ms) ${res.statusCode}`;
        this.fileLogger.verbose(message);
        this.nestLogger.log(message);
      }

      if (isModifiable) {
        const rootPath = req.url.split('/').filter((r) => !this.regexPrefix.test(r));
        this.cacheManager.store.keys().then((keys) => {
          const resourcePath = rootPath[1]; // because '' at 0
          keys
            .filter((k) => k.includes(resourcePath))
            .forEach((k) => {
              this.cacheManager.store.del(k);
            });
        });
      }
    });
    next?.();
  }
}

@Injectable()
class PaginationMiddleware implements NestMiddleware {
  use(req: FastifyRequest, _: FastifyReply['raw'], next: () => any) {
    if (RegExp(/find/).exec(req.originalUrl)) {
      const query = parse(req.originalUrl.split('?')[1]) as { page: string | number; pageSize: string | number };
      const { page, pageSize } = query;
      query.page = page && +page > 0 ? +page : 1;
      query.pageSize = pageSize && +pageSize > 0 ? +pageSize : 10;
      Object.assign(req.query as any, query);
    } else if (RegExp(/dashboard/).exec(req.originalUrl)) {
      const query = parse(req.originalUrl.split('?')[1]);
      Object.assign(req.query as any, query);
    }
    next?.();
  }
}

@Module({
  imports: [
    LandingModule,
    JwtModule.register({ global: true, signOptions: { expiresIn: '1h' } }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const ttl = parseInt(process.env.REDIS_TTL ?? '30000');
        const config: CacheManagerOptions = { ttl };

        // Check if Redis is configured
        if (process.env.REDIS_HOST) {
          const { redisStore } = await import('cache-manager-redis-yet');
          const redisConfig = configService.get('redis');

          // Use the URL from our redis config
          config.store = await redisStore({
            url: redisConfig.url,
            ttl,
          });
        }

        return config;
      },
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 100,
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 1000,
        limit: 20,
      },
      {
        name: 'long',
        ttl: 5000,
        limit: 100,
      },
    ]),
    WinstonModule.forRoot({
      format: format.json(),
      transports: [
        new DailyRotateFile({
          filename: 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD-HH',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '7d',
          level: 'error',
        }),
        new DailyRotateFile({
          filename: 'logs/request-%DATE%.log',
          datePattern: 'YYYY-MM-DD-HH',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '7d',
          level: 'verbose',
        }),
      ],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [appConfig, bullConfig, redisConfig],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => {
        const password = encodeURIComponent(process.env.REDIS_PASSWORD || '');
        const redisUrl = `redis://:${password}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;
        console.log('Connecting with Redis URL:', redisUrl);

        return {
          redis: redisUrl,
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: CacheInterceptor },
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    IsUniqueConstraint,
    IsSameAsConstraint,
    ExistsConstraint,
  ],
  controllers: [StaticController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL });
    consumer.apply(PaginationMiddleware).forRoutes({ path: '*', method: RequestMethod.GET });
  }
}
