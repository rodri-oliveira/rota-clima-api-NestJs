import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') ?? 'dev_secret_change_me',
    });
  }

  async validate(payload: { sub: string; email: string }) {
    // O usuário já foi validado pelo JWT; retornamos o payload para estar disponível em req.user
    return { userId: payload.sub, email: payload.email };
  }
}
