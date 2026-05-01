import { Router } from "express";
import {
  updateAvatar,
  getMyProfile,
  getAllProfiles,
  updateMyProfile,
  updateUser,
  userProfileDownload,
  getPublicUserProfile,
} from "./user.controller.js";
import { uploadAvatar } from "../../config/cloudinary.js";
import { verifyAccessToken } from "../../middlewares/verifyAccessToken.middleware.js";

const router = Router();

router.get("/profiles/me", verifyAccessToken, getMyProfile);

// Another user's profile (for deep links)
router.get("/profile/:userId", verifyAccessToken, getPublicUserProfile);

// Get all profiles
router.get("/profiles", verifyAccessToken, getAllProfiles);

// Download user profile
router.get(
  "/profiles/download/:userId",
  verifyAccessToken,
  userProfileDownload,
);

// Update profile (bio, pastWork, education)
router.patch("/profiles/me", verifyAccessToken, updateMyProfile);

// Update user account (name, email, username)
router.patch("/me", verifyAccessToken, updateUser);

// Update avatar
router.patch(
  "/profiles/me/avatar",
  verifyAccessToken,
  uploadAvatar.single("avatar"),
  updateAvatar,
);



export default router;
