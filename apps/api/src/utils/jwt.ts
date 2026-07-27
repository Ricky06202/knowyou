import { sign, verify } from "hono/jwt";
import type { JwtPayload } from "hono/utils/jwt/types";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const ACCESS_EXPIRES = 60 * 60 * 24; // 24 hours
const REFRESH_EXPIRES = 60 * 60 * 24 * 30; // 30 days

export interface TokenPayload extends JwtPayload {
  sub: string;
  email: string;
}

export async function generateAccessToken(userId: string, email: string): Promise<string> {
  return sign(
    { sub: userId, email, exp: Math.floor(Date.now() / 1000) + ACCESS_EXPIRES },
    ACCESS_SECRET,
    "HS256"
  );
}

export async function generateRefreshToken(userId: string, email: string): Promise<string> {
  return sign(
    { sub: userId, email, exp: Math.floor(Date.now() / 1000) + REFRESH_EXPIRES },
    REFRESH_SECRET,
    "HS256"
  );
}

export async function verifyAccessToken(token: string): Promise<TokenPayload> {
  return verify(token, ACCESS_SECRET, "HS256") as Promise<TokenPayload>;
}

export async function verifyRefreshToken(token: string): Promise<TokenPayload> {
  return verify(token, REFRESH_SECRET, "HS256") as Promise<TokenPayload>;
}
