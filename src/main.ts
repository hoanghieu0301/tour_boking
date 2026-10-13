import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const apiEnvPath = resolve(process.cwd(), 'src/api/.env');
if (existsSync(apiEnvPath)) {
  loadEnv({ path: apiEnvPath });
}
loadEnv();

import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';
import { urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useWebSocketAdapter(new IoAdapter(app));
  app.use(urlencoded({ extended: true }));
  app.enableCors({
    origin: (origin, callback) => {
      // Cho phép tất cả origin kết nối (localhost, IP mạng LAN, domain khi deploy)
      callback(null, true);
    },
    credentials: true,
  });
  // Ưu tiên PORT từ hosting cloud (Render, Koyeb...), sau đó đến API_PORT hoặc mặc định 4000
  const port = Number(process.env.PORT) || Number(process.env.API_PORT) || 4000;
  await app.listen(port, '0.0.0.0');
  console.log(`API listening on http://localhost:${port}`);
  console.log('DATABASE_URL =', process.env.DATABASE_URL);
}
bootstrap();
