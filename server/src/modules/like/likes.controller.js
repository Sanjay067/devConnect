import Like from "./likes.model.js";
import Post from "../post/posts.model.js";
import Comment from "../comment/comments.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import mongoose from "mongoose";
import { updatePostScoreAsync } from "../post/score.worker.js";

export const getPostLikes = asyncHandler(async (req, res) => {
  const postId = req.params.postId;

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return res.status(400).json({ message: "Invalid Post ID" });
  }

  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(50, Math.max(1, Number(req.query.limit || 20)));
  const skip = (page - 1) * limit;

  const [likes, total] = await Promise.all([
    Like.find({ targetId: postId, targetType: "Post" })
      .populate("userId", "name username profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Like.countDocuments({ targetId: postId, targetType: "Post" })
  ]);

  return res.json({
    message: "Likes fetched successfully",
    likes,
    page,
    limit,
    total,
    hasMore: skip + likes.length < total
  });
});


export const toggleLikePost = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const postId = req.params.postId;

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return res.status(400).json({ message: "Invalid Post ID" });
  }

  const session = await mongoose.startSession();

  let increment = 1;
  let post = null;

  try {
    await session.withTransaction(async () => {
      const existing = await Like.findOne({
        userId,
        targetId: postId,
        targetType: "Post",
      }).session(session);

      if (existing) {
        await Like.deleteOne({ _id: existing._id }).session(session);
        increment = -1;
      } else {
        try {
          await Like.create(
            [{ userId, targetId: postId, targetType: "Post" }],
            { session }
          );
        } catch (err) {
          if (err.code === 11000) {
            throw new Error("ALREADY_LIKED");
          }
          throw err;
        }
      }

      post = await Post.findByIdAndUpdate(
        postId,
        { $inc: { likeCount: increment } },
        { returnDocument: "after", session } // Fixed deprecated "new: true"
      );

      if (!post) {
        throw new Error("POST_NOT_FOUND");
      }
    });
  } catch (err) {
    if (err.message === "ALREADY_LIKED") {
      return res.json({ message: "Already liked" });
    }
    if (err.message === "POST_NOT_FOUND") {
      return res.status(404).json({ message: "Post not found" });
    }
    throw err;
  } finally {
    session.endSession();
  }

  // Execute background worker ONLY if the post was successfully found & updated


  if (post) {
    updatePostScoreAsync(post);
  }

  return res.json({
    message: increment === 1 ? "Post liked" : "Post unliked",
    likeCount: post.likeCount,
  });
});

export const toggleLikeComment = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const commentId = req.params.commentId;

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    return res.status(400).json({ message: "Invalid Comment ID" });
  }

  const session = await mongoose.startSession();
  
  let increment = 1;
  let comment = null;

  try {
    await session.withTransaction(async () => {
      const existing = await Like.findOne({
        userId,
        targetId: commentId,
        targetType: "Comment",
      }).session(session);

      if (existing) {
        await Like.deleteOne({ _id: existing._id }).session(session);
        increment = -1;
      } else {
        try {
          await Like.create(
            [{ userId, targetId: commentId, targetType: "Comment" }],
            { session }
          );
        } catch (err) {
          if (err.code === 11000) {
            throw new Error("ALREADY_LIKED");
          }
          throw err;
        }
      }

      comment = await Comment.findByIdAndUpdate(
        commentId,
        { $inc: { likeCount: increment } },
        { returnDocument: "after", session }
      );

      if (!comment) {
        throw new Error("COMMENT_NOT_FOUND");
      }
    });
  } catch (err) {
    if (err.message === "ALREADY_LIKED") {
      return res.json({ message: "Already liked" });
    }
    if (err.message === "COMMENT_NOT_FOUND") {
      return res.status(404).json({ message: "Comment not found" });
    }
    throw err;
  } finally {
    session.endSession();
  }

  return res.json({
    message: increment === 1 ? "Comment liked" : "Comment unliked",
    likeCount: comment.likeCount,
  });
});

