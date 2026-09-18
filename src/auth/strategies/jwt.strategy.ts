import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';
import { JwtPayload, PublicUser } from '../auth.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly auth: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'nest-learning-dev-secret',
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: JwtPayload): PublicUser {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);

    return this.auth.assertActiveToken(token, payload);
  }
}
