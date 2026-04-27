import Comment from "./comments.model.js";
import Like from "../like/likes.model.js";
import Post from "./posts.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const addComment = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { body } = req.body;

    if (!body || body.trim().length === 0) {
      return res.status(400).json({ message: "Comment body is required" });
    }

    // Verify post exists
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = await Comment.create({
      postId,
      author: req.user._id,
      body,
      parentComment: null,
    });

    // Increment comment count on the post atomically
    await Post.updateOne({ _id: postId }, { $inc: { commentCount: 1 } });

    await comment.populate("author", "name username profilePicture");

  return res.status(201).json({
    message: "Comment added",
    comment,
  });
});

export const replyToComment = asyncHandler(async (req, res) => {
  const { postId, commentId } = req.params;
    const { body } = req.body;

    if (!body || body.trim().length === 0) {
      return res.status(400).json({ message: "Reply body is required" });
    }

    // Verify parent comment exists and belongs to this post
    const parentComment = await Comment.findById(commentId);
    if (!parentComment || String(parentComment.postId) !== postId) {
      return res.status(404).json({ message: "Parent comment not found" });
    }

    const reply = await Comment.create({
      postId,
      author: req.user._id,
      body,
      parentComment: commentId,
    });

    // Increment comment count on the post atomically
    await Post.updateOne({ _id: postId }, { $inc: { commentCount: 1 } });

    await reply.populate("author", "name username profilePicture");

  return res.status(201).json({
    message: "Reply added",
    comment: reply,
  });
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
      return res.status(200).json({ message: "No changes detected" });
    }

    comment.body = body;
    await comment.save();

  return res.status(200).json({
    message: "Comment updated",
    comment,
  });
});

export const deleteComment = asyncHandler(async (req, res) => {
  const comment = req.comment;
    const { postId } = req.params;

    // Soft-delete — replies still reference this comment
    comment.isDeleted = true;
    comment.body = "";
    await comment.save();

    // Decrement comment count on the post atomically
    await Post.updateOne({ _id: postId, commentCount: { $gt: 0 } }, { $inc: { commentCount: -1 } });

  return res.status(200).json({ message: "Comment deleted" });
});

export const getComments = asyncHandler(async (req, res) => {
  const { postId } = req.params;
    const userId = req.user._id;

    // Verify post exists
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Get top-level comments (parentComment is null)
    const comments = await Comment.find({
      postId,
      parentComment: null,
      isDeleted: false,
    })
      .populate("author", "name username profilePicture")
      .sort({ createdAt: -1 });

    const commentIds = comments.map((c) => c._id);
    const likes = await Like.find({
      userId,
      targetType: "Comment",
      targetId: { $in: commentIds },
    }).select("targetId");
    const likedCommentIds = new Set(likes.map((l) => String(l.targetId)));

    const replyCounts = await Comment.aggregate([
      {
        $match: {
          parentComment: { $in: commentIds },
          isDeleted: false,
        },
      },
      { $group: { _id: "$parentComment", count: { $sum: 1 } } },
    ]);
    const replyCountMap = new Map(
      replyCounts.map((r) => [String(r._id), Number(r.count || 0)]),
    );
    const commentsWithReplies = comments.map((comment) => ({
      ...comment.toObject(),
      replyCount: replyCountMap.get(String(comment._id)) || 0,
      isLiked: likedCommentIds.has(String(comment._id)),
    }));

  return res.status(200).json({
    commentCount: post.commentCount,
    comments: commentsWithReplies,
  });
});

export const getReplies = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
    const userId = req.user._id;

    const replies = await Comment.find({
      parentComment: commentId,
      isDeleted: false,
    })
      .populate("author", "name username profilePicture")
      .sort({ createdAt: 1 });

    const replyIds = replies.map((r) => r._id);
    const likes = await Like.find({
      userId,
      targetType: "Comment",
      targetId: { $in: replyIds },
    }).select("targetId");
    const likedReplyIds = new Set(likes.map((l) => String(l.targetId)));

    const repliesWithLikeState = replies.map((reply) => ({
      ...reply.toObject(),
      isLiked: likedReplyIds.has(String(reply._id)),
    }));

  return res.status(200).json({ replies: repliesWithLikeState });
});
