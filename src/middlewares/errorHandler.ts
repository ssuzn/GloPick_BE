import { ErrorRequestHandler } from "express";
import { AppError } from "../errors/AppError";
import { ZodError } from "zod";

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      code: err.statusCode,
      message: err.message,
      data: null,
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      code: 400,
      message: err.issues[0]?.message ?? "잘못된 요청입니다.",
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
