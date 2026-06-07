import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { DatabaseErrorInterceptor } from './common/interceptors/database-error.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import type { HostConfig } from './config/configuration.types';

const API_PREFIX = 'api';
const SWAGGER_TITLE = 'API Documentation';
const SWAGGER_DESCRIPTION = 'API Documentation';
const SWAGGER_VERSION = '1.0';

export async function bootstrap() {
  const isProduction =
    process.env.NODE_ENV === 'production' || process.env.MODE === 'production';
  const loggerLevels = isProduction
    ? ['error', 'warn']
    : ['error', 'warn', 'log', 'debug', 'verbose'];

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    logger: loggerLevels as any,
  });

  const configService = app.get(ConfigService);

  // Fail-fast JWT validation in production
  const mode = configService.get<string>('mode');
  const authConfig = configService.get<any>('auth');
  if (mode === 'production') {
    const jwtSecret = authConfig?.jwtSecret;
    const jwtRefreshSecret = authConfig?.jwtRefreshSecret;
    if (
      !jwtSecret ||
      jwtSecret === 'your-secret-key' ||
      jwtSecret === 'default-secret'
    ) {
      throw new Error(
        'PRODUCTION SECURITY ERROR: jwtSecret must be configured with a unique, secure value in production.',
      );
    }
    if (!jwtRefreshSecret || jwtRefreshSecret === 'your-refresh-secret') {
      throw new Error(
        'PRODUCTION SECURITY ERROR: jwtRefreshSecret must be configured with a unique, secure value in production.',
      );
    }
  }

  // App config
  app.setGlobalPrefix(API_PREFIX);

  // CORS
  const allowedOrigins =
    configService.get<string[]>('cors.allowedOrigins') || [];
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global filters - chỉ dùng AllExceptionsFilter
  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalInterceptors(
    new DatabaseErrorInterceptor(),
    new TimeoutInterceptor(),
    new TransformInterceptor(), // Transform response first
  );

  // Swagger
  const config = new DocumentBuilder()
    .setTitle(SWAGGER_TITLE)
    .setDescription(SWAGGER_DESCRIPTION)
    .setVersion(SWAGGER_VERSION)
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(API_PREFIX, app, document, {
    swaggerOptions: {
      defaultModelsExpandDepth: -1,
    },
  });

  const host = configService.get<HostConfig>('host');
  const port = host?.port || 3000;

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger documentation: http://localhost:${port}/${API_PREFIX}`);
}

if (require.main === module) {
  void bootstrap();
}
