export type AuthErrorCode = "AUTH_INVALID_CREDENTIALS" | "AUTH_EMAIL_ALREADY_USED" | "AUTH_INVALID_INPUT";

export class AuthError extends Error {
  constructor(
    public readonly code: AuthErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export function isAuthError(value: unknown): value is AuthError {
  return value instanceof AuthError;
}
