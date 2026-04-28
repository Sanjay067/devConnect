import mongoose from "mongoose";

import Post from "./posts.model.js";
import Like from "../like/likes.model.js";
import Comment from "../comment/comments.model.js";

import { asyncHandler } from "../../utils/asyncHandler.js";
import { cloudinary } from "../../config/cloudinary.js";

const parseJSON = (data, fallback = []) => {
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch {
      return fallback;
    }
  }
  return data || fallback;
};


export const getAllUserPosts = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  // Sort by newest first and populate author
  const posts = await Post.find({ author: userId })
    .populate("author", "name username profilePicture")
    .sort({ createdAt: -1 });

  const postIds = posts.map((p) => p._id);
  const userLikes = await Like.find({
    userId,
    targetId: { $in: postIds },
    targetType: "Post",
  }).select("targetId");

  const likedSet = new Set(userLikes.map((l) => String(l.targetId)));

  const finalPosts = posts.map((p) => ({
    ...p.toObject(),
    isLiked: likedSet.has(String(p._id)),
  }));

  return res
    .status(200)
    .json({ message: "Posts fetched successfully", posts: finalPosts });
});

export const createPost = asyncHandler(async (req, res) => {
  const {
    title,
    content,
    shortDescription,
    links,
    techStack,
    lookingForContributors,
  } = req.body;

  if (!title?.trim()) {
    return res.status(400).json({ message: "Post title is required" });
  }

  const parsedContent = parseJSON(content, null);
  if (!parsedContent || !parsedContent.blocks || parsedContent.blocks.length === 0) {
    return res.status(400).json({ message: "Valid content is required" });
  }

  const media = (req.files || []).map((file) => ({
    url: file.path,
    publicId: file.filename,
    type: file.mimetype.startsWith("image/")
      ? "image"
      : file.mimetype.startsWith("video/")
        ? "video"
        : "file",
  }));

  const parsedLinks = parseJSON(links, []);
  const parsedTechStack = parseJSON(techStack, []);
  const isLooking = lookingForContributors === "true" || lookingForContributors === true;

  const newPost = await Post.create({
    author: req.user._id,
    title,
    shortDescription,
    content: parsedContent,
    media,
    links: parsedLinks,
    techStack: parsedTechStack,
    lookingForContributors: isLooking,
  });

  return res.status(201).json({
    message: "Post created successfully",
    post: newPost,
  });
});

export const editPost = asyncHandler(async (req, res) => {
  const { title, content, shortDescription, existingMedia, links, techStack, lookingForContributors } = req.body;

  if (title !== undefined && !title?.trim()) {
    return res.status(400).json({ message: "Post title is required" });
  }

  let parsedContent = content;
  if (content !== undefined) {
    parsedContent = parseJSON(content, null);
    if (!parsedContent || !parsedContent.blocks || parsedContent.blocks.length === 0) {
      return res.status(400).json({ message: "Valid content is required" });
    }
  }

  const post = await Post.findById(req.params.postId);
  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }

  if (post.author.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  const originalMedia = post.media || [];
  const keepMedia = existingMedia !== undefined ? parseJSON(existingMedia, []) : originalMedia;

  const deletedMedia = originalMedia.filter(
    (om) => !keepMedia.find((km) => km.publicId === om.publicId)
  );

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const newMedia = (req.files || []).map((file) => ({
      url: file.path,
      publicId: file.filename,
      type: file.mimetype.startsWith("image/")
        ? "image"
        : file.mimetype.startsWith("video/")
          ? "video"
          : "file",
    }));

    const finalMedia = [...keepMedia, ...newMedia];

    if (title !== undefined) post.title = title.trim();
    if (shortDescription !== undefined) post.shortDescription = shortDescription?.trim();
    if (parsedContent !== undefined) post.content = parsedContent;
    post.media = finalMedia;

    if (links !== undefined) post.links = parseJSON(links, []);
    if (techStack !== undefined) post.techStack = parseJSON(techStack, []);

    if (lookingForContributors !== undefined) {
      post.lookingForContributors = lookingForContributors === "true" || lookingForContributors === true;
    }

    await post.save({ session });

    await session.commitTransaction();
    session.endSession();

    for (const file of deletedMedia) {
      try {
        await cloudinary.uploader.destroy(file.publicId);
      } catch (_) { }
    }

    await post.populate("author", "username profilePicture");

    return res.status(200).json({
      message: "Post updated successfully",
      post,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
});




export const deletePost = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const post = await Post.findById(req.params.postId).session(session);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const mediaToDelete = post.media || [];

    await Like.deleteMany({
      targetId: post._id,
      targetType: "Post",
    }).session(session);

    await Comment.deleteMany({
      postId: post._id,
    }).session(session);

    await Post.deleteOne({ _id: post._id }).session(session);

    await session.commitTransaction();
    session.endSession();

    for (const file of mediaToDelete) {
      try {
        await cloudinary.uploader.destroy(file.publicId);
      } catch (_) { }
    }

    return res.status(200).json({ message: "Post deleted!" });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
});
