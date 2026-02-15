import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: registerDto.name,
        email: registerDto.email,
        password: hashedPassword,
      },
    });

    return this.generateTokens(user.id, user.email);
  }

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordMatches = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!passwordMatches)
      throw new UnauthorizedException('Invalid credentials');

    return this.generateTokens(user.id, user.email);
  }

  async generateTokens(userId: string, email: string) {
    const accessToken = await this.jwt.signAsync(
      {
        sub: userId,
        email,
      },
      { secret: process.env.JWT_SECRET, expiresIn: '15m' },
    );

    const refreshToken = await this.jwt.signAsync(
      { sub: userId, email },
      { secret: process.env.JWT_REFRESH_SECRET, expiresIn: '7d' },
    );

    await this.updateRefreshToken(userId, refreshToken);

    return { accessToken, refreshToken };
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    const preHashed = this.hashTokenBeforeBcrypt(refreshToken);
    const hashed = await bcrypt.hash(preHashed, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashed },
    });
    console.log('new', refreshToken);
    console.log('new prehashed', preHashed);
    console.log('new hashed', hashed);
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.refreshToken)
      throw new UnauthorizedException('Access Denied');

    const preHashed = this.hashTokenBeforeBcrypt(refreshToken);
    const refreshMatches = await bcrypt.compare(preHashed, user.refreshToken);

    console.log('old', refreshToken);
    console.log('prehashed', preHashed);
    console.log('matched', refreshMatches);

    if (!refreshMatches) throw new UnauthorizedException('Access Denied');

    return this.generateTokens(user.id, user.email);
  }

  private hashTokenBeforeBcrypt(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
