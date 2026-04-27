import Post from "./posts.model.js";
import Like from "../like/likes.model.js";
import { cloudinary } from "../../config/cloudinary.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

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
  const { title, content, shortDescription, links, techStack, lookingForContributors } = req.body;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ message: "Post title is required" });
    }
    if (!content) {
      return res.status(400).json({ message: "Post content is required" });
    }

    const media = req.files
      ? req.files.map((file) => ({
        url: file.path,
        publicId: file.filename,
        type: file.mimetype.startsWith("image/")
          ? "image"
          : file.mimetype.startsWith("video/")
            ? "video"
            : "file",
      }))
      : [];

    let parsedLinks = [];
    if (links) {
      try {
        parsedLinks = typeof links === "string" ? JSON.parse(links) : links;
      } catch (e) {
        parsedLinks = [];
      }
    }

    let parsedContent;
    if (content) {
      try {
        parsedContent = typeof content === "string" ? JSON.parse(content) : content;
      } catch (e) {
        parsedContent = content;
      }
    }

    let parsedTechStack = [];
    if (techStack) {
      try {
        parsedTechStack = typeof techStack === "string" ? JSON.parse(techStack) : techStack;
      } catch (e) {
        parsedTechStack = [];
      }
    }

    const newPost = new Post({
      author: req.user._id,
      title,
      shortDescription,
      content: parsedContent,
      media,
      links: parsedLinks,
      techStack: parsedTechStack,
      lookingForContributors: lookingForContributors === "true" || lookingForContributors === true,
    });

    await newPost.save();

  return res.status(200).json({
    message: "Post created successfully",
    post: newPost,
  });
});

export const editPost = asyncHandler(async (req, res) => {
  const { title, content, shortDescription, existingMedia, links, techStack, lookingForContributors } = req.body;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ message: "Post title is required" });
    }
    if (!content) {
      return res.status(400).json({ message: "Post content is required" });
    }
    const post = await Post.findById(req.params.postId);

    const originalMedia = post.media || [];
    let finalMedia = [];

    if (existingMedia) {
      try {
        finalMedia = JSON.parse(existingMedia);
      } catch (e) {
        // Fallback for array notation or empty
        finalMedia = [];
      }
    }

    // find removed media
    const deletedMedia = originalMedia.filter(
      (om) => !finalMedia.find((fm) => fm.publicId === om.publicId)
    );

    // delete from cloudinary
    for (const file of deletedMedia) {
      try {
        await cloudinary.uploader.destroy(file.publicId);
      } catch (err) {
        console.error(`Failed to delete from Cloudinary: ${file.publicId}`, err);
      }
    }

    // add new uploads
    if (req.files && req.files.length > 0) {
      const newMedia = req.files.map((file) => ({
        url: file.path,
        publicId: file.filename,
        type: file.mimetype.startsWith("image/")
          ? "image"
          : file.mimetype.startsWith("video/")
            ? "video"
            : "file",
      }));
      finalMedia = [...finalMedia, ...newMedia];
    }

    let parsedLinks;
    if (links) {
      try {
        parsedLinks = typeof links === "string" ? JSON.parse(links) : links;
      } catch (e) {
        parsedLinks = [];
      }
    }

    let parsedContent;
    if (content) {
      try {
        parsedContent = typeof content === "string" ? JSON.parse(content) : content;
      } catch (e) {
        parsedContent = content;
      }
    }

    let parsedTechStack;
    if (techStack) {
      try {
        parsedTechStack = typeof techStack === "string" ? JSON.parse(techStack) : techStack;
      } catch (e) {
        parsedTechStack = [];
      }
    }

    post.title = title.trim();
    if (shortDescription !== undefined) post.shortDescription = shortDescription.trim();
    post.content = parsedContent;
    post.media = finalMedia;
    if (parsedLinks) post.links = parsedLinks;
    if (parsedTechStack) post.techStack = parsedTechStack;
    if (lookingForContributors !== undefined) {
       post.lookingForContributors = lookingForContributors === "true" || lookingForContributors === true;
    }
    
    await post.save();

    // populate author for response
    await post.populate("author", "name username profilePicture");

  return res.status(200).json({
    message: "Post updated successfully",
    post,
  });
});

export const deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findByIdAndDelete(req.params.postId);

    if (post.media && post.media.length > 0) {
      for (const file of post.media) {
        try {
          await cloudinary.uploader.destroy(file.publicId);
        } catch (err) {
          console.error(
            `Failed to delete from Cloudinary: ${file.publicId}`,
            err,
          );
        }
      }
    }

  return res.status(200).json({ message: "Post deleted!" });
});
