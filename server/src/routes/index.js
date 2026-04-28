import { Router } from "express";
import userRoutes from "../modules/user/user.routes.js";
import authRoutes from "../modules/auth/auth.routes.js";
import postRoutes from "../modules/post/posts.routes.js";
import feedRoutes from "../modules/feed/feed.routes.js";
import followRoutes from "../modules/follow/follow.routes.js";
import messageRoutes from "../modules/message/message.routes.js";

const router = Router();

router.use("/users", userRoutes);
router.use("/auth", authRoutes);
router.use("/posts", postRoutes);
router.use("/feed", feedRoutes);
router.use("/follows", followRoutes); // renamed from connections
router.use("/messages", messageRoutes);


export default router;
