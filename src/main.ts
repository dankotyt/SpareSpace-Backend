import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CustomIoAdapter } from './adapters/custom-io.adapter';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const config = new DocumentBuilder()
    .setTitle('NestJS Backend API')
    .setDescription('API на базе NestJS для управления данными, аутентификацией и реал-тайм событиями')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.useWebSocketAdapter(
    new CustomIoAdapter(app, {
      cors: {
        origin: '*', // потом заменить на конкретный домен (для продакшена)
      },
      path: '/socket.io/',
      transports: ['polling', 'websocket'],
      serveClient: false,
    }),
  );

  await app.listen(configService.get('PORT', 3000));
}

bootstrap();
