import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import type { AppConfig } from './config/configuration';

const SWAGGER_PATH = 'api';
const SWAGGER_TITLE = 'API Documentation';
const SWAGGER_DESCRIPTION = 'API Documentation';
const SWAGGER_VERSION = '1.0';

export async function bootstrap() {
  const isProduction =
    process.env.NODE_ENV === 'production' || process.env.MODE === 'production';
  const loggerLevels = isProduction
    ? ['error', 'warn']
    : ['error', 'warn', 'debug', 'verbose'];

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    logger: loggerLevels as any,
  });

  const configService = app.get(ConfigService);

  // Fail-fast JWT validation in production
  const appConfig = configService.get<AppConfig>('app');
  const mode = appConfig?.mode;
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

  // CORS
  app.enableCors({
    origin: true,
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

  // Swagger
  const config = new DocumentBuilder()
    .setTitle(SWAGGER_TITLE)
    .setDescription(SWAGGER_DESCRIPTION)
    .setVersion(SWAGGER_VERSION)
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(SWAGGER_PATH, app, document, {
    swaggerOptions: {
      defaultModelsExpandDepth: -1,
    },
  });

  const port = appConfig?.port ?? 3000;
  const host = appConfig?.host ?? '0.0.0.0';

  await app.listen(port, host);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(
    `Swagger documentation: http://localhost:${port}/${SWAGGER_PATH}`,
  );
}

if (require.main === module) {
  void bootstrap();
}
