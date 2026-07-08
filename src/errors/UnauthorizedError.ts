import { AppError } from "./AppError";

export class UnauthorizedError extends AppError {
  constructor(message = "인증이 필요합니다.") {
    super(401, message);
  }
}
