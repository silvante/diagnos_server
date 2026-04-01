import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const req = context.switchToHttp().getRequest();
    const authHeader = req.header('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }

    const token = authHeader.split(' ')[1];

    try {
      const data = this.jwt.verify(token);

      if (!data.admin_access) {
        throw new HttpException('yaroqsiz kirish tokeni', 408);
      }
      return true;
    } catch (error) {
      throw new HttpException('Autentifikatsiya talab qilinadi', 408);
    }
  }
}
