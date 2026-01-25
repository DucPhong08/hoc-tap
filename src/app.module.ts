import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import loader from './config/loader';
import { dbModules } from './constants';
import { UsersModule } from './users/users.module';

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
    ...dbModules,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
