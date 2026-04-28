import { Router } from "express";
import { verifyAccessToken } from "../../middlewares/verifyAccessToken.middleware.js";
import { toggleLikeComment } from "../like/likes.controller.js";
import { addComment, replyToComment, editComment, deleteComment, getComments, getReplies } from "./comments.controller.js";
import { isCommentAuthor } from "../../middlewares/isCommentAuthor.middleware.js";
import multer from "multer";

const upload = multer();
const router = Router({ mergeParams: true });

router
    .route("/")
    .get(verifyAccessToken, getComments)
    .post(verifyAccessToken, upload.none(), addComment);
router
    .route("/:commentId/replies")
    .get(verifyAccessToken, getReplies)
    .post(verifyAccessToken, upload.none(), replyToComment);
router
    .route("/:commentId")
    .patch(verifyAccessToken, isCommentAuthor, upload.none(), editComment)
    .delete(verifyAccessToken, isCommentAuthor, deleteComment);
router
    .route("/:commentId/like")
    .post(verifyAccessToken, toggleLikeComment);
export default router;