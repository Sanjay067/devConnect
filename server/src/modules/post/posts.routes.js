import { Router } from "express";

import {
  getAllUserPosts,
  createPost,
  deletePost,
  editPost,
} from "./posts.controller.js";
import { toggleLikePost, getPostLikes } from "../like/likes.controller.js";
import { verifyAccessToken } from "../../middlewares/verifyAccessToken.middleware.js";
import { isPostAuthor } from "../../middlewares/isPostAuthor.middleware.js";
import commentRoutes from "../comment/comments.routes.js";

const router = Router();


import { uploadPostMedia } from "../../config/cloudinary.js";



router
  .route("/")
  .get(verifyAccessToken, getAllUserPosts)
  .post(verifyAccessToken, uploadPostMedia.array("media", 5), createPost);
router
  .route("/:postId")
  .patch(verifyAccessToken, isPostAuthor, uploadPostMedia.array("media", 5), editPost)
  .delete(verifyAccessToken, isPostAuthor, deletePost);

// Like/unlike a post

router
  .route("/:postId/like")
  .get(verifyAccessToken, getPostLikes)
  .post(verifyAccessToken, toggleLikePost)

// Mount comment routes under /:postId/comments

router.use("/:postId/comments", commentRoutes);

export default router;
