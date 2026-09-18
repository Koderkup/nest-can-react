export type PublicUser = {
  id: string;
  email: string;
};

export type AuthTokenResponse = {
  accessToken: string;
  user: PublicUser;
};

export type JwtPayload = {
  sub: string;
  email: string;
};
