import { Router } from "express";
import { verifyAccessToken } from "../../middlewares/verifyAccessToken.middleware.js";
import { followUser, unfollowUser, getFollowers, getFollowing } from "./follow.controller.js";

const router = Router();

router.post("/:followingId", verifyAccessToken, followUser);
router.delete("/:followingId", verifyAccessToken, unfollowUser);

router.get("/:userId/followers", verifyAccessToken, getFollowers);
router.get("/:userId/following", verifyAccessToken, getFollowing);

export default router;
