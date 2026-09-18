import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {
  AuthTokenResponse,
  JwtPayload,
  PublicUser,
} from './auth.types';

type StoredUser = PublicUser & {
  passwordHash: string;
};

@Injectable()
export class AuthService {
  private readonly users = new Map<string, StoredUser>();
  private readonly activeTokens = new Set<string>();

  constructor(private readonly jwt: JwtService) {}

  async register(email: string, password: string): Promise<AuthTokenResponse> {
    const normalized = normalizeEmail(email);

    if (!normalized || password.length < 6) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (this.findStoredByEmail(normalized)) {
      throw new ConflictException('Email is already registered.');
    }

    const user: StoredUser = {
      id: crypto.randomUUID(),
      email: normalized,
      passwordHash: await bcrypt.hash(password, 10),
    };

    this.users.set(user.id, user);

    return this.issueToken(user);
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<PublicUser | null> {
    const user = this.findStoredByEmail(normalizeEmail(email));

    if (!user) {
      return null;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);

    if (!valid) {
      return null;
    }

    return toPublicUser(user);
  }

  login(user: PublicUser): AuthTokenResponse {
    const stored = this.users.get(user.id);

    if (!stored) {
      throw new UnauthorizedException('User not found.');
    }

    return this.issueToken(stored);
  }

  logout(token: string | undefined): { ok: true } {
    if (token) {
      this.activeTokens.delete(token);
    }

    return { ok: true };
  }

  findById(id: string): PublicUser | null {
    const user = this.users.get(id);

    return user ? toPublicUser(user) : null;
  }

  assertActiveToken(token: string | null, payload: JwtPayload): PublicUser {
    if (!token || !this.activeTokens.has(token)) {
      throw new UnauthorizedException('Session expired.');
    }

    const user = this.findById(payload.sub);

    if (!user || user.email !== payload.email) {
      throw new UnauthorizedException('Invalid token.');
    }

    return user;
  }

  private issueToken(user: StoredUser): AuthTokenResponse {
    const publicUser = toPublicUser(user);
    const payload: JwtPayload = {
      sub: publicUser.id,
      email: publicUser.email,
    };
    const accessToken = this.jwt.sign(payload);

    this.activeTokens.add(accessToken);

    return { accessToken, user: publicUser };
  }

  private findStoredByEmail(email: string): StoredUser | undefined {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }

    return undefined;
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function toPublicUser(user: StoredUser): PublicUser {
  return { id: user.id, email: user.email };
}
