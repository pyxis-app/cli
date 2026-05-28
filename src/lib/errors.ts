export class AuthError extends Error {
  readonly code = "AUTH_ERROR" as const;
}

export class RateLimitError extends Error {
  readonly code = "RATE_LIMIT" as const;
  constructor(message: string, public retryAfterSeconds: number | null = null) {
    super(message);
  }
}

export class ServerError extends Error {
  readonly code = "SERVER_ERROR" as const;
  constructor(message: string, public status: number) {
    super(message);
  }
}

export class LoginCancelledError extends Error {
  readonly code = "LOGIN_CANCELLED" as const;
}

export class TimeoutError extends Error {
  readonly code = "TIMEOUT" as const;
}
