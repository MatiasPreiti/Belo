import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../roles/public';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    try {
      const result = (await super.canActivate(context)) as boolean;

      if (!result) {
        throw new UnauthorizedException(
          'Authentication failed through JwtAuthGuard',
        );
      }
      return result;
    } catch (error) {
      console.error('JwtAuthGuard: Authentication failed:', error.message);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
