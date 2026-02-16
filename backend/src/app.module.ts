import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { StoresModule } from './stores/stores.module';

@Module({
  imports: [ConfigModule.forRoot(), PrismaModule, AuthModule, StoresModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
