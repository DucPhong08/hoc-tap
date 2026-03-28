import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import type {
  AppConfig,
  CorsConfig,
  HostConfig,
  SwaggerConfig,
  ValidationConfig,
} from './config/configuration.types';

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
  const corsConfig = configService.get<CorsConfig>('cors');
  app.enableCors({
    origin: corsConfig?.origins || ['http://localhost:3000'],
    credentials: true,
  });

  // Validation
  const validationConfig = configService.get<ValidationConfig>('validation');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: validationConfig?.whitelist ?? true,
      forbidNonWhitelisted: validationConfig?.forbidNonWhitelisted ?? true,
      transform: validationConfig?.transform ?? true,
    }),
  );

  // Global filters - chỉ dùng AllExceptionsFilter
  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalInterceptors(
    new TransformInterceptor(), // Transform response first
  );

  // Swagger
  const swaggerConfig = configService.get<SwaggerConfig>('swagger');
  if (swaggerConfig?.enabled) {
    const config = new DocumentBuilder()
      .setTitle(swaggerConfig.title)
      .setDescription(swaggerConfig.description)
      .setVersion(swaggerConfig.version)
      .addBearerAuth()
      .addTag('auth')
      .addTag('users')
      .addTag('products')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(swaggerConfig.path, app, document, {
      swaggerOptions: {
        defaultModelsExpandDepth: -1,
      },
    });
  }

  const host = configService.get<HostConfig>('host');
  const port = host?.port || 3000;

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger documentation: http://localhost:${port}/api`);
}

if (require.main === module) {
  void bootstrap();
}
