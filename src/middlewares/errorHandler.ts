import { ErrorRequestHandler } from "express";
import { AppError } from "../errors/AppError";

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      code: err.statusCode,
      message: err.message,
      data: null,
    });
    return;
  }

  console.error(err);

  res.status(500).json({
    code: 500,
    message: "서버 오류",
    data: null,
  });
};