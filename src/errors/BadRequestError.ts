import { AppError } from "./AppError";

export class BadRequestError extends AppError {
  constructor(message = "잘못된 요청입니다.") {
    super(400, message);
  }
}