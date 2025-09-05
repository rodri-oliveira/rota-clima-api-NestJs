import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface UsuarioJwtPayload {
  userId: string;
  email: string;
}

export const UsuarioAtual = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UsuarioJwtPayload | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request?.user as UsuarioJwtPayload | undefined;
  },
);
