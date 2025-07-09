import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import crypto from 'crypto';

const g = global as typeof globalThis & { crypto?: any };
if (!g.crypto) {
  g.crypto = {};
}
if (!g.crypto.randomUUID) {
  // Fallback UUID v4 generator (TypeScript-safe)
  g.crypto.randomUUID = () => {
    if (crypto && typeof crypto.randomBytes === 'function') {
      return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) => (
        Number(c) ^
        ((crypto.randomBytes(1)[0] & 15) >> (Number(c) / 4))
      ).toString(16),
      );
    } else {
      // Very basic fallback (not cryptographically secure)
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
        /[xy]/g,
        function (c) {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        },
      );
    }
  };
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Log CORS config for verification
  console.log('CORS config loaded:', {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  });

  // Enable CORS
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
