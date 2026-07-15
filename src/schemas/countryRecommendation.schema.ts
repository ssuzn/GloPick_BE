import { z } from "zod";

export const profileIdParamSchema = z.object({
  profileId: z.coerce.number().int().positive("프로필 ID가 올바르지 않습니다."),
});

export type ProfileIdParamDto = z.infer<typeof profileIdParamSchema>;