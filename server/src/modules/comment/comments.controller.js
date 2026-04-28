import mongoose from "mongoose";
import Comment from "./comments.model.js";
import Like from "../like/likes.model.js";
import Post from "../post/posts.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { updatePostScoreAsync } from "../post/score.worker.js";

export const addComment = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { body } = req.body;

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return res.status(400).json({ message: "Invalid Post ID" });
  }

  if (!body || body.trim().length === 0) {
    return res.status(400).json({ message: "Comment body is required" });
  }

  const session = await mongoose.startSession();
  let comment;
  let post;

  try {
    await session.withTransaction(async () => {
      post = await Post.findByIdAndUpdate(
        postId,
        { $inc: { commentCount: 1 } },
        { returnDocument: "after", session }
      );

      if (!post) throw new Error("POST_NOT_FOUND");

      const created = await Comment.create(
        [{
          postId,
          author: req.user._id,
          body: body.trim(),
          parentComment: null,
        }],
        { session }
      );
      comment = created[0];
    });
  } catch (error) {
    if (error.message === "POST_NOT_FOUND") {
      return res.status(404).json({ message: "Post not found" });
    }
    throw error;
  } finally {
    session.endSession();
  }

  if (post) updatePostScoreAsync(post);
  await comment.populate("author", "name username profilePicture");

  return res.status(201).json({ message: "Comment added", comment });
});

export const replyToComment = asyncHandler(async (req, res) => {
  const { postId, commentId } = req.params;
  const { body } = req.body;

  if (!mongoose.Types.ObjectId.isValid(postId) || !mongoose.Types.ObjectId.isValid(commentId)) {
    return res.status(400).json({ message: "Invalid ID format" });
  }

  if (!body || body.trim().length === 0) {
    return res.status(400).json({ message: "Reply body is required" });
  }

  const session = await mongoose.startSession();
  let reply;
  let post;

  try {
    await session.withTransaction(async () => {
      const parentComment = await Comment.findByIdAndUpdate(
        commentId,
        { $inc: { replyCount: 1 } },
        { session }
      );

      if (!parentComment || String(parentComment.postId) !== postId) {
        throw new Error("PARENT_NOT_FOUND");
      }

      post = await Post.findByIdAndUpdate(
        postId,
        { $inc: { commentCount: 1 } },
        { returnDocument: "after", session }
      );

      if (!post) throw new Error("POST_NOT_FOUND");

      const created = await Comment.create(
        [{
          postId,
          author: req.user._id,
          body: body.trim(),
          parentComment: commentId,
        }],
        { session }
      );
      reply = created[0];
    });
  } catch (error) {
    if (error.message === "PARENT_NOT_FOUND") return res.status(404).json({ message: "Parent comment not found" });
    if (error.message === "POST_NOT_FOUND") return res.status(404).json({ message: "Post not found" });
    throw error;
  } finally {
    session.endSession();
  }

  if (post) updatePostScoreAsync(post);
  await reply.populate("author", "name username profilePicture");

  return res.status(201).json({ message: "Reply added", comment: reply });
});

export const editComment = asyncHandler(async (req, res) => {
  const comment = req.comment;
  const { body } = req.body;

  if (!body || body.trim().length === 0) {
    return res.status(400).json({ message: "Comment body is required" });
  }

  if (comment.isDeleted) {
    return res.status(400).json({ message: "Cannot edit a deleted comment" });
  }

  if (comment.body === body.trim()) {
    return res.status(200).json({ message: "No changes detected", comment });
  }

  comment.body = body.trim();
  await comment.save();

  return res.status(200).json({ message: "Comment updated", comment });
});

export const deleteComment = asyncHandler(async (req, res) => {
  const comment = req.comment;
  const { postId } = req.params;

  if (comment.isDeleted) {
    return res.status(400).json({ message: "Comment is already deleted" });
  }

  const session = await mongoose.startSession();
  let post;

  try {
    await session.withTransaction(async () => {
      comment.isDeleted = true;
      comment.body = "";
      await comment.save({ session });

      if (comment.parentComment) {
        await Comment.updateOne(
          { _id: comment.parentComment, replyCount: { $gt: 0 } },
          { $inc: { replyCount: -1 } }
        ).session(session);
      }

      post = await Post.findOneAndUpdate(
        { _id: postId, commentCount: { $gt: 0 } },
        { $inc: { commentCount: -1 } },
        { returnDocument: "after", session }
      );
    });
  } catch (error) {
    throw error;
  } finally {
    session.endSession();
  }

  if (post) updatePostScoreAsync(post);

  return res.status(200).json({ message: "Comment deleted" });
});

export const getComments = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return res.status(400).json({ message: "Invalid Post ID" });
  }

  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(50, Math.max(1, Number(req.query.limit || 20)));
  const skip = (page - 1) * limit;

  const post = await Post.findById(postId).select("commentCount");
  if (!post) return res.status(404).json({ message: "Post not found" });

  const query = {
    postId,
    parentComment: null,
    $or: [{ isDeleted: false }, { replyCount: { $gt: 0 } }],
  };

  const [comments, total] = await Promise.all([
    Comment.find(query)
      .populate("author", "name username profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Comment.countDocuments(query)
  ]);

  const commentIds = comments.map((c) => c._id);
  const likes = await Like.find({
    userId,
    targetType: "Comment",
    targetId: { $in: commentIds },
  }).select("targetId");
  const likedCommentIds = new Set(likes.map((l) => String(l.targetId)));

  const commentsWithReplies = comments.map((comment) => ({
    ...comment,
    replyCount: comment.replyCount || 0,
    isLiked: likedCommentIds.has(String(comment._id)),
  }));

  return res.status(200).json({
    commentCount: post.commentCount,
    comments: commentsWithReplies,
    page,
    limit,
    total,
    hasMore: skip + comments.length < total
  });
});

export const getReplies = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    return res.status(400).json({ message: "Invalid Comment ID" });
  }

  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(50, Math.max(1, Number(req.query.limit || 20)));
  const skip = (page - 1) * limit;

  const query = {
    parentComment: commentId,
    $or: [{ isDeleted: false }, { replyCount: { $gt: 0 } }],
  };

  const [replies, total] = await Promise.all([
    Comment.find(query)
      .populate("author", "name username profilePicture")
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Comment.countDocuments(query)
  ]);

  const replyIds = replies.map((r) => r._id);
  const likes = await Like.find({
    userId,
    targetType: "Comment",
    targetId: { $in: replyIds },
  }).select("targetId");
  const likedReplyIds = new Set(likes.map((l) => String(l.targetId)));

  const repliesWithLikeState = replies.map((reply) => ({
    ...reply,
    isLiked: likedReplyIds.has(String(reply._id)),
  }));

  return res.status(200).json({
    replies: repliesWithLikeState,
    page,
    limit,
    total,
    hasMore: skip + replies.length < total
  });
});
