import express from "express";
import { protect } from "../middlewares/authMiddleware";
import { asyncHandler } from "../utils/asyncHandler";
import {
  createProfile,
  getProfileOptions,
} from "../controllers/profileController";

const router = express.Router();

// 드롭다운 옵션 조회 (GET /api/profile/options)
router.get("/options", asyncHandler(getProfileOptions));

// 사용자 이력 등록 (POST /api/profile)
router.post("/", protect, asyncHandler(createProfile));

export default router;
