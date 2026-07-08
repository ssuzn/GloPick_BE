import { Request, Response } from "express";
import bcrypt from "bcrypt";
import axios from "axios";
import { generateToken } from "../utils/generateToken";
import { BadRequestError } from "../errors/BadRequestError";
import { UnauthorizedError } from "../errors/UnauthorizedError";
import { ConflictError } from "../errors/ConflictError";
import { AuthService } from "../services/authService";

// 회원가입
export const register = async (req: Request, res: Response) => {
  const { name, email, password, passwordConfirm, birth, phone } = req.body;

  if (password !== passwordConfirm) {
    throw new BadRequestError("비밀번호가 일치하지 않습니다.");
  }

  const existingUser = await AuthService.findUserByEmail(email);

  if (existingUser) {
    throw new BadRequestError("이미 존재하는 이메일입니다.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await AuthService.createLocalUser({
    name,
    email,
    password: hashedPassword,
    birth,
    phone,
  });

  res.status(201).json({ code: 201, message: "회원가입 성공!", data: null });
};

// 로그인
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await AuthService.findUserByEmail(email);

  if (!user) {
    throw new UnauthorizedError(
      "사용자를 찾을 수 없습니다. 이메일을 확인해주세요.",
    );
  }

  // 카카오 로그인 사용자 체크
  if (!user.password) {
    throw new UnauthorizedError(
      "카카오 로그인 사용자입니다. 일반 로그인을 이용해주세요.",
    );
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new UnauthorizedError("비밀번호가 틀렸습니다.");
  }

  const token = generateToken(user.id.toString());
  console.log(`토큰 : ${token}`);
  res.status(201).json({
    code: 201,
    message: "로그인 성공!",
    data: {
      name: user.name,
      email: user.email,
      birth: user.birth,
      phone: user.phone,
      token,
    },
  });
};

// 카카오 로그인 - 인가 코드 요청 URL 생성
export const getKakaoAuthUrl = (req: Request, res: Response) => {
  const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${process.env.KAKAO_REST_API_KEY}&redirect_uri=${process.env.KAKAO_REDIRECT_URI}&response_type=code`;

  res.status(200).json({
    code: 200,
    message: "카카오 인증 URL 생성 성공",
    data: { authUrl: kakaoAuthUrl },
  });
};

// 카카오 로그인 - 콜백 처리
export const kakaoCallback = async (req: Request, res: Response) => {
  const { code } = req.query;

  if (!code) {
    throw new BadRequestError("인가 코드가 없습니다.");
  }

  // 1. 액세스 토큰 받기
  const tokenResponse = await axios.post(
    "https://kauth.kakao.com/oauth/token",
    null,
    {
      params: {
        grant_type: "authorization_code",
        client_id: process.env.KAKAO_REST_API_KEY,
        redirect_uri: process.env.KAKAO_REDIRECT_URI,
        code,
      },
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      },
    },
  );

  const { access_token } = tokenResponse.data;

  // 2. 사용자 정보 가져오기
  const userResponse = await axios.get("https://kapi.kakao.com/v2/user/me", {
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    },
  });

  const kakaoUser = userResponse.data;
  console.log("카카오 사용자 정보:", kakaoUser);
  const kakaoId = kakaoUser.id.toString();
  const email = kakaoUser.kakao_account?.email;
  const name = kakaoUser.kakao_account?.profile?.nickname || "카카오 사용자";
  const phone = kakaoUser.kakao_account?.phone_number;
  const birthday = kakaoUser.kakao_account?.birthday; // MMDD 형식
  const birthyear = kakaoUser.kakao_account?.birthyear; // YYYY 형식

  if (!email) {
    throw new BadRequestError(
      "카카오 계정에 이메일 정보가 없습니다. 이메일 제공 동의가 필요합니다.",
    );
  }

  // 3. 사용자 확인 또는 생성
  let user = await AuthService.findUserByKakaoId(kakaoId);

  if (!user) {
    // 이메일로 기존 사용자 확인
    const existingUser = await AuthService.findUserByEmail(email);

    if (existingUser) {
      // 기존 일반 회원가입 사용자가 있는 경우
      if (existingUser.provider === "local" && !existingUser.kakaoId) {
        // 일반 회원가입 계정이 이미 존재 - 보안상 연동 차단
        throw new ConflictError(
          "이미 해당 이메일로 가입된 계정이 있습니다. 일반 로그인을 이용해주세요.",
        );
      }
      // 이미 카카오 정보가 있는 경우 (정상 케이스)
      user = existingUser;
    } else {
      // 새로운 사용자 생성
      const birth =
        birthyear && birthday
          ? `${birthyear}-${birthday.slice(0, 2)}-${birthday.slice(2, 4)}`
          : undefined;

      user = await AuthService.createKakaoUser({
        name,
        email,
        kakaoId,
        birth,
        phone,
      });
    }
  }

  // 4. JWT 토큰 생성
  const token = generateToken(user.id.toString());

  const frontendUrl = process.env.FRONTEND_URL || "https://glopick.netlify.app";
  return res.redirect(
    `${frontendUrl}/oauth/kakao?token=${token}&name=${encodeURIComponent(
      user.name,
    )}&email=${encodeURIComponent(user.email)}`,
  );
};
