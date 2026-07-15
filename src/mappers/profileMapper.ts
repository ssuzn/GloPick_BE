import { UserProfile } from "../generated/prisma/client";

const toJobCode = (desiredJob: string) => desiredJob.replace("JOB_", "");

export class ProfileMapper {
  static toResponse(profile: UserProfile) {
    return {
      profileId: profile.id,
      language: profile.language,
      desiredJob: toJobCode(profile.desiredJob),
      qualityOfLifeWeights: {
        income: profile.incomeWeight,
        jobs: profile.jobsWeight,
        health: profile.healthWeight,
        lifeSatisfaction: profile.lifeSatisfactionWeight,
        safety: profile.safetyWeight,
      },
      weights: {
        languageWeight: profile.languageWeight,
        jobWeight: profile.jobWeight,
        qualityOfLifeWeight: profile.qualityOfLifeWeight,
      },
      createdAt: profile.createdAt,
    };
  }
}