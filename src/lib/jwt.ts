import jwt from 'jsonwebtoken';

// Centralized JWT secret handling. Fails fast at import time when JWT_SECRET
// is missing outside dev mode, instead of silently signing/verifying tokens
// with a hardcoded default that would let anyone forge a session.
const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

function resolveSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (isDevMode) return 'dev-mode-insecure-secret-do-not-use-in-production';
  throw new Error(
    'JWT_SECRET environment variable is not set. Refusing to start with an insecure default.'
  );
}

export const JWT_SECRET = resolveSecret();
export const JWT_EXPIRES_IN = '7d';

export interface AuthTokenPayload {
  userId: string;
  username: string;
  email?: string;
  isGuest?: boolean;
}

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
}
