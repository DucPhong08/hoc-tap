import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AppConfig } from './config/root/app.config';

const SWAGGER_OPTIONS = {
  enabled: true,
  path: 'api',
  title: 'Hoc Tap API',
  description: 'NestJS Clean Architecture Boilerplate with MikroORM',
  version: '1.0',
};

const VALIDATION_OPTIONS = {
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
};

export async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    logger: ['error', 'warn'],
  });

  const configService = app.get(ConfigService);

  // App config
  const appConfig = configService.get<AppConfig>('app');
  if (appConfig?.apiPrefix) {
    app.setGlobalPrefix(appConfig.apiPrefix);
  }

  // CORS
  app.enableCors();

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: VALIDATION_OPTIONS.whitelist,
      forbidNonWhitelisted: VALIDATION_OPTIONS.forbidNonWhitelisted,
      transform: VALIDATION_OPTIONS.transform,
    }),
  );

  // Global filters - chỉ dùng AllExceptionsFilter
  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalInterceptors(
    new TransformInterceptor(), // Transform response first
    new LoggingInterceptor(), // Then log
  );

  // Swagger
  if (SWAGGER_OPTIONS.enabled) {
    const config = new DocumentBuilder()
      .setTitle(SWAGGER_OPTIONS.title)
      .setDescription(SWAGGER_OPTIONS.description)
      .setVersion(SWAGGER_OPTIONS.version)
      .addBearerAuth()
      .addTag('auth')
      .addTag('users')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(SWAGGER_OPTIONS.path, app, document, {
      swaggerOptions: {
        defaultModelsExpandDepth: -1,
      },
    });
  }

  const host = configService.get<{ host: string; port: number }>('host');
  const port = host?.port || 3000;

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger documentation: http://localhost:${port}/api`);
}

if (require.main === module) {
  void bootstrap();
}
