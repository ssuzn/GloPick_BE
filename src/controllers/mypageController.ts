import { Response } from "express";
import bcrypt from "bcrypt";
import { AuthRequest } from "../middlewares/authMiddleware";
import { NotFoundError } from "../errors/NotFoundError";
import { ConflictError } from "../errors/ConflictError";
import { MyPageUserService } from "../services/myPage/myPageUserService";
import { MyPageProfileService } from "../services/myPage/myPageProfileService";
import { MyPageSimulationService } from "../services/myPage/myPageSimulationService";
import { MyPageRecommendationService } from "../services/myPage/myPageRecommendationService";
import { ProfileMapper } from "../mappers/profileMapper";
import { MyPageSimulationMapper } from "../mappers/myPageSimulationMapper";
import { MyPageRecommendationMapper } from "../mappers/myPageRecommendationMapper";

export const getUserInfo = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new NotFoundError("사용자 정보가 존재하지 않습니다.");
  }

  const user = await MyPageUserService.findById(req.user.id);

  if (!user) {
    throw new NotFoundError("사용자 정보가 존재하지 않습니다.");
  }

  return res.status(200).json({
    code: 200,
    message: "사용자 정보 조회 성공",
    data: {
      userId: user.id,
      name: user.name,
      email: user.email,
      birth: user.birth,
      phone: user.phone,
    },
  });
};

export const updateUserInfo = async (req: AuthRequest, res: Response) => {
  const { name, email, password, birth, phone } = req.body;

  const user = await MyPageUserService.findById(req.user!.id);

  if (!user) {
    throw new NotFoundError("사용자 정보가 존재하지 않습니다.");
  }

  if (email && email !== user.email) {
    const existingUser = await MyPageUserService.findByEmail(email);

    if (existingUser) {
      throw new ConflictError("이미 사용 중인 이메일입니다.");
    }
  }

  const hashedPassword =
    typeof password === "string" && password.trim() !== ""
      ? await bcrypt.hash(password.trim(), 10)
      : undefined;

  const updatedUser = await MyPageUserService.update({
    id: req.user!.id,
    ...(name && { name }),
    ...(email && { email }),
    ...(birth && { birth }),
    ...(phone && { phone }),
    ...(hashedPassword && { password: hashedPassword }),
  });

  return res.status(200).json({
    code: 200,
    message: "사용자 정보 수정 성공",
    data: {
      userId: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      birth: updatedUser.birth,
      phone: updatedUser.phone,
    },
  });
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  const user = await MyPageUserService.findById(req.user!.id);

  if (!user) {
    throw new NotFoundError("사용자 정보가 존재하지 않습니다.");
  }

  await MyPageUserService.delete(req.user!.id);

  return res.status(200).json({
    code: 200,
    message: "회원 탈퇴 완료!",
    data: null,
  });
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  const profiles = await MyPageProfileService.findByUserId(req.user!.id);

  if (profiles.length === 0) {
    throw new NotFoundError("사용자 이력 정보가 존재하지 않습니다.");
  }

  return res.status(200).json({
    code: 200,
    message: "이력 정보 조회 성공",
    data: profiles.map(ProfileMapper.toResponse),
  });
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  const profileId = Number(req.params.id);

  const profile = await MyPageProfileService.findById(profileId, req.user!.id);

  if (!profile) {
    throw new NotFoundError("이력을 찾을 수 없습니다.");
  }

  const { language, desiredJob, qualityOfLifeWeights, weights } = req.body;

  const updatedProfile = await MyPageProfileService.update(profileId, {
    ...(language && { language }),
    ...(desiredJob && { desiredJob: `JOB_${desiredJob}` }),
    ...(qualityOfLifeWeights && {
      incomeWeight: qualityOfLifeWeights.income,
      jobsWeight: qualityOfLifeWeights.jobs,
      healthWeight: qualityOfLifeWeights.health,
      lifeSatisfactionWeight: qualityOfLifeWeights.lifeSatisfaction,
      safetyWeight: qualityOfLifeWeights.safety,
    }),
    ...(weights && {
      languageWeight: weights.languageWeight,
      jobWeight: weights.jobWeight,
      qualityOfLifeWeight: weights.qualityOfLifeWeight,
    }),
  });

  return res.status(200).json({
    code: 200,
    message: "이력 정보 수정 성공",
    data: ProfileMapper.toResponse(updatedProfile),
  });
};

export const deleteProfile = async (req: AuthRequest, res: Response) => {
  const profileId = Number(req.params.id);

  const profile = await MyPageProfileService.findById(profileId, req.user!.id);

  if (!profile) {
    throw new NotFoundError("이력을 찾을 수 없습니다.");
  }

  await MyPageProfileService.delete(profileId);

  return res.status(200).json({
    code: 200,
    message: "이력 삭제 완료",
    data: null,
  });
};

export const getUserSimulations = async (req: AuthRequest, res: Response) => {
  const simulations = await MyPageSimulationService.findByUserId(req.user!.id);

  if (simulations.length === 0) {
    throw new NotFoundError("저장된 시뮬레이션 결과가 없습니다.");
  }

  return res.status(200).json({
    code: 200,
    message: "시뮬레이션 결과 조회 성공",
    data: simulations.map(MyPageSimulationMapper.toResponse),
  });
};

export const getUserRecommendations = async (
  req: AuthRequest,
  res: Response,
) => {
  const recommendations = await MyPageRecommendationService.findByUserId(
    req.user!.id,
  );

  if (recommendations.length === 0) {
    throw new NotFoundError("저장된 추천 결과가 없습니다.");
  }

  return res.status(200).json({
    code: 200,
    message: "추천 결과 조회 성공",
    data: recommendations.map(MyPageRecommendationMapper.toResponse),
  });
};

export const getRecommendationsByProfileId = async (
  req: AuthRequest,
  res: Response,
) => {
  const { profileId } = req.params;

  const recommendations = await MyPageRecommendationService.findByProfileId(
    req.user!.id,
    Number(profileId),
  );

  if (recommendations.length === 0) {
    throw new NotFoundError("해당 이력에 대한 추천 결과가 없습니다.");
  }

  return res.status(200).json({
    code: 200,
    message: "추천 결과 조회 성공",
    data: recommendations.map(MyPageRecommendationMapper.toResponse),
  });
};

export const getSimulationsByProfileId = async (
  req: AuthRequest,
  res: Response,
) => {
  const { profileId } = req.params;

  const simulations = await MyPageSimulationService.findByProfileId(
    req.user!.id,
    Number(profileId),
  );

  if (simulations.length === 0) {
    throw new NotFoundError("해당 이력에 대한 시뮬레이션 결과가 없습니다.");
  }

  return res.status(200).json({
    code: 200,
    message: "시뮬레이션 결과 조회 성공",
    data: simulations.map(MyPageSimulationMapper.toResponse),
  });
};
