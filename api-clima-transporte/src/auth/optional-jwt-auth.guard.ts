import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, _info: any, _context: ExecutionContext, _status?: any) {
    // Não lança erro quando não autenticado; apenas retorna user = undefined
    if (err) {
      throw err;
    }
    return user || undefined;
  }
}
