import dayjs from 'dayjs';
import 'dotenv/config';

import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

BigInt.prototype['toJSON'] = function () {
  return this.toString();
};
const startApp = async () => {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ caseSensitive: true, bodyLimit: 50 * 1024 * 2024 }),
  );
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  const config = new DocumentBuilder()
    .setTitle('Course Station API')
    .setDescription('Course Station API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.enableCors();
  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 33333;
  await app.listen(port, '0.0.0.0');
};

async function bootstrap() {
  await startApp();
}
bootstrap();

export const dayjsImport = dayjs;
