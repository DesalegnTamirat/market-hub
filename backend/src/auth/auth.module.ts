import { Global, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { RefreshTokenStrategy } from './jwt/refresh.strategy';

@Global()
@Module({
  imports: [PassportModule, JwtModule.register({})],
  providers: [AuthService, JwtService, RefreshTokenStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
