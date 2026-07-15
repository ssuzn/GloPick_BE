import { prisma } from "../db";
import { DesiredJob, Language } from "../generated/prisma/client";

interface CreateProfileParams {
  userId: number;
  language: Language;
  desiredJob: DesiredJob;

  incomeWeight: number;
  jobsWeight: number;
  healthWeight: number;
  lifeSatisfactionWeight: number;
  safetyWeight: number;

  languageWeight: number;
  jobWeight: number;
  qualityOfLifeWeight: number;
}

export class ProfileService {
  static findByUserId(userId: number) {
    return prisma.userProfile.findMany({
      where: {
        userId,
      },
    });
  }

  static create(data: CreateProfileParams) {
    return prisma.userProfile.create({
      data,
    });
  }
}