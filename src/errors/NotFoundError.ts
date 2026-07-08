import { AppError } from "./AppError";

export class NotFoundError extends AppError {
  constructor(message = "데이터를 찾을 수 없습니다.") {
    super(404, message);
  }
}