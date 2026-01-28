import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import loader from './config/loader';
import { UsersModule } from './modules/users/users.module';
import { ProductModule } from './modules/products/product.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { TransactionModule } from './common/transaction/transaction.module';
import { OrmMikroModule } from './infra/orm-mikro.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [loader],
      ignoreEnvFile: false,
      validationOptions: {
        allowUnknown: false,
        abortEarly: true,
      },
    }),
    OrmMikroModule,
    TransactionModule,
    AuthModule.forRoot(),
    UsersModule,
    ProductModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
