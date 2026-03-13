import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as crypto from 'crypto';
import { RequestWithUser } from './interfaces/request-with-user.interface';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new UnauthorizedException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: registerDto.name,
        email: registerDto.email,
        password: hashedPassword,
      },
    });

    return this.generateTokens(user);
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

    return this.generateTokens(user);
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    return { message: 'Logged out successfully' };
  }

  async getProfile(req: RequestWithUser) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.sub },
    });
    return {
      id: user?.id,
      name: user?.name,
      email: user?.email,
      role: user?.role,
    };
  }

  async generateTokens(user: {
    id: string;
    name: string;
    email: string;
    role: string;
  }) {
    const accessToken = await this.jwt.signAsync(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      { secret: process.env.JWT_SECRET, expiresIn: '20d' },
    );

    const refreshToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email, role: user.role },
      { secret: process.env.JWT_REFRESH_SECRET, expiresIn: '7d' },
    );

    await this.updateRefreshToken(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    const preHashed = this.hashTokenBeforeBcrypt(refreshToken);
    const hashed = await bcrypt.hash(preHashed, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashed },
    });
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.refreshToken)
      throw new UnauthorizedException('Access Denied');

    const preHashed = this.hashTokenBeforeBcrypt(refreshToken);
    const refreshMatches = await bcrypt.compare(preHashed, user.refreshToken);

    if (!refreshMatches) throw new UnauthorizedException('Access Denied');

    return this.generateTokens(user);
  }

  private hashTokenBeforeBcrypt(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
