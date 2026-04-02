declare module 'jsonwebtoken' {
  export interface JwtPayload {
    [key: string]: unknown;
    iss?: string;
    sub?: string;
    aud?: string | string[];
    exp?: number;
    nbf?: number;
    iat?: number;
    jti?: string;
  }

  export function verify(
    token: string,
    secretOrPublicKey: string,
    options?: { algorithms?: string[] },
  ): JwtPayload | string;

  export function sign(
    payload: string | object | Buffer,
    secretOrPrivateKey: string,
    options?: { expiresIn?: string | number; algorithm?: string },
  ): string;

  export function decode(token: string): JwtPayload | string | null;
}
