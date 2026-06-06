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
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    logger: ['error', 'warn'],
  });

  const configService = app.get(ConfigService);

  // App config
  app.setGlobalPrefix(API_PREFIX);

  // CORS
  app.enableCors({});

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
