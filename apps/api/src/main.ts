import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { UserService } from './services/user.service';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Run automatic role migration on startup
  try {
    const userService = app.get(UserService);
    await userService.fixRoles();
    logger.log('✅ Role migration completed successfully');
  } catch (error) {
    logger.warn('⚠️ Role migration failed (this is normal on first run):', error.message);
  }

  const corsOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:3001'];

  app.enableCors({
    origin: (origin, callback) => {
      // السماح بجميع منافذ localhost في التطوير
      if (!origin || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        callback(null, true);
      } else if (corsOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3001;
  await app.listen(port);

  logger.log(`🚀 Arabic Meet API running on: http://localhost:${port}`);
}

bootstrap();
