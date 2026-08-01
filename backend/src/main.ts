import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

// Prisma returns BigInt for large numeric fields (Player.power, currency and
// resource balances). JSON.stringify cannot serialise BigInt and throws
// "Do not know how to serialize a BigInt", which surfaced as a 500 on every
// endpoint returning such a field (register, login, player reads). Serialise
// BigInt as a string globally so those values round-trip safely (spec §98).
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS — the Unity client and admin panel are served from other origins.
  // Allow the deployed public domain plus any explicitly configured origins
  // (comma-separated CORS_ORIGINS env). Falls back to reflecting all origins
  // in non-production so local tooling keeps working (spec §98, §114).
  const configured = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  const defaults = [
    'https://728065aeb.abacusai.cloud',
    'http://localhost:3000',
    'http://localhost:3001',
  ];
  const allowList = Array.from(new Set([...defaults, ...configured]));
  app.enableCors({
    origin:
      process.env.NODE_ENV === 'production'
        ? allowList
        : true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.setGlobalPrefix('api', { exclude: ['/', 'health'] });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  await app.listen(port);
  Logger.log(`Shadows of the Shogun backend listening on :${port}`, 'Bootstrap');
}
bootstrap();
