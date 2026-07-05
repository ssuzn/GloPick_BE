import jwt from "jsonwebtoken";
import { Request, RequestHandler } from "express";
import { prisma } from "../db";
import { AuthUser } from "../types/auth";

export const protect: RequestHandler = async (req, res, next): Promise<void> => {
  const token = req.headers.authorization;

  if (!token || !token.startsWith("Bearer")) {
    res.status(401).json({ message: "토큰이 없습니다." });
    return;
  }

  try {
    const decoded = jwt.verify(
      token.split(" ")[1],
      process.env.JWT_SECRET!
    ) as { id: string };

    const user = await prisma.user.findUnique({
      where: { id: Number(decoded.id) },
      select: {
        id: true,
        name: true,
        email: true,
        birth: true,
        phone: true,
        kakaoId: true,
        provider: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(401).json({
        message: "인증 실패: 사용자를 찾을 수 없습니다.",
      });
      return;
    }

    req.user = {
      ...user,
      _id: user.id,
    } as AuthUser;

    next();
  } catch (error) {
    res.status(401).json({ message: "인증 실패: 유효하지 않은 토큰" });
    return;
  }
};

export const optionalAuth: RequestHandler = async (
  req,
  res,
  next
): Promise<void> => {
  const token = req.headers.authorization;

  if (token && token.startsWith("Bearer")) {
    try {
      const decoded = jwt.verify(
        token.split(" ")[1],
        process.env.JWT_SECRET!
      ) as { id: string };

      const user = await prisma.user.findUnique({
        where: { id: Number(decoded.id) },
        select: {
          id: true,
          name: true,
          email: true,
          birth: true,
          phone: true,
          kakaoId: true,
          provider: true,
          createdAt: true,
        },
      });

      if (user) {
        req.user = {
          ...user,
          _id: user.id,
        } as AuthUser;
      }
    } catch (error) {
      console.log("토큰 검증 실패, 비인증 상태로 진행:", error);
    }
  }

  next();
};

export type AuthRequest = Request & {
  user?: AuthUser;
};