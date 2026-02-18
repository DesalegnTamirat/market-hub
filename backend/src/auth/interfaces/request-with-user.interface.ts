import { Role } from '@prisma/client';
import { Request } from 'express';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  refreshToken?: string;
}

export interface RequestWithUser extends Request {
  user: JwtPayload;
}
