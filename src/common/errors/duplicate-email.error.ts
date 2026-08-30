import { AppError } from './app.error';

export class DuplicateEmailError extends AppError {
  constructor(email: string) {
    super(`El correo ${email} ya está registrado.`, 409);
  }
}