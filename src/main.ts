import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CustomIoAdapter } from './adapters/custom-io.adapter';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

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
