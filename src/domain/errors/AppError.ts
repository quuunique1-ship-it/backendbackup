export class AppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends AppError {}

export class ValidationError extends AppError {}

export class UnauthorizedError extends AppError {}

export class ForbiddenError extends AppError {}

export class ConflictError extends AppError {}

export class AuthenticationError extends AppError {}
