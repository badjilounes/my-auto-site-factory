import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
import { IS_PUBLIC_KEY } from './public.decorator';

interface JwtPayload {
  id: string;
  email: string;
  role: string;
  sub?: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger('JwtAuthGuard');

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);
    const secret = process.env['NEXTAUTH_SECRET'];

    if (!secret) {
      this.logger.error('NEXTAUTH_SECRET is not configured');
      throw new UnauthorizedException('Authentication service misconfigured');
    }

    try {
      const raw = jwt.verify(token, secret);
      const decoded = (typeof raw === 'string' ? JSON.parse(raw) : raw) as Record<string, unknown>;

      request.user = {
        id: (decoded['id'] as string) || (decoded['sub'] as string),
        email: decoded['email'] as string,
        role: decoded['role'] as string,
      };

      return true;
    } catch (error) {
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token has expired');
      }
      if (error instanceof Error && error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token');
      }
      throw new UnauthorizedException('Authentication failed');
    }
  }
}
