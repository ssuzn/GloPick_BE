import { AppError } from "./AppError";

export class ConflictError extends AppError {
  constructor(message = "이미 존재하는 데이터입니다.") {
    super(409, message);
  }
}