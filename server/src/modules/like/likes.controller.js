import Like from "./likes.model.js";
import Post from "../post/posts.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import mongoose from "mongoose";
import { updatePostScoreAsync } from "../post/score.worker.js";

export const getPostLikes = asyncHandler(async (req, res) => {
  const postId = req.params.postId;

  const likes = await Like.find({ targetId: postId, targetType: "Post" }).populate("userId", "name username profilePicture");

  return res.json({ message: "Likes fetched successfully", likes });
});


export const toggleLikePost = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user._id;
    const postId = req.params.postId;

    const existing = await Like.findOne({
      userId,
      targetId: postId,
      targetType: "Post",
    }).session(session);

    let increment = 1;

    if (existing) {
      await Like.deleteOne({ _id: existing._id }).session(session);
      increment = -1;
    } else {
      await Like.create(
        [{ userId, targetId: postId, targetType: "Post" }],
        { session }
      );
    }

    const post = await Post.findByIdAndUpdate(
      postId,
      { $inc: { likeCount: increment } },
      { new: true, session }
    );

    await session.commitTransaction();
    session.endSession();

    updatePostScoreAsync(post);

    return res.json({
      message: increment === 1 ? "Post liked" : "Post unliked",
      likeCount: post.likeCount,
    });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    if (err.code === 11000) {
      return res.json({ message: "Already liked" });
    }

    throw err;
  }
});