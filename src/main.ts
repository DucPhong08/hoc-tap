import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AppConfig } from './config/root/app.config';
import { SwaggerConfig } from './config/root/swagger.config';
import { ValidationConfig } from './config/root/validation.config';
import { CorsConfig } from './config/root/cors.config';

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

  // Global interceptors
  app.useGlobalInterceptors(new LoggingInterceptor());

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

  const host = configService.get<{ host: string; port: number }>('host');
  const port = host?.port || 3000;

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger documentation: http://localhost:${port}/api`);
}

if (require.main === module) {
  void bootstrap();
}
