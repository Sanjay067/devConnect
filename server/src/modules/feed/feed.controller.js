import Follow from "../follow/follow.model.js";
import Post from "../post/posts.model.js";
import Like from "../like/likes.model.js";
import User from "../user/users.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

function computeScore(post, user, followingSet) {
  // Engagement
  const likeScore = Math.log1p(post.likeCount || 0) * 2;
  const commentScore = Math.log1p(post.commentCount || 0) * 3;

  // Recency
  const createdAt = post.createdAt ? new Date(post.createdAt).getTime() : Date.now();
  const ageHours = Math.max(0, (Date.now() - createdAt) / (1000 * 60 * 60));
  const recencyScore = 1 / (1 + ageHours / 6); 

  // Project Relevance
  let skillMatch = 0;
  let interestMatch = 0;
  
  if (post.techStack && post.techStack.length > 0) {
     const postTags = post.techStack.map(t => t.toLowerCase());
     const userSkills = (user.skills || []).map(s => s.toLowerCase());
     const userInterests = (user.interests || []).map(s => s.toLowerCase());
     
     skillMatch = postTags.filter(t => userSkills.includes(t)).length * 5; 
     interestMatch = postTags.filter(t => userInterests.includes(t)).length * 3; 
  }

  // Network Relevance
  const authorId = String(post.author?._id || post.author);
  const networkScore = followingSet.has(authorId) ? 10 : 0; // big boost if following the author

  return likeScore + commentScore + recencyScore + skillMatch + interestMatch + networkScore;
}

export const getFeed = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(50, Math.max(1, Number(req.query.limit || 20)));

  // Fetch full user to get skills/interests
  const user = await User.findById(userId).select("skills interests");

  // Fetch who the user follows
  const follows = await Follow.find({ followerId: userId }).select("followingId");
  const followingSet = new Set(follows.map(f => String(f.followingId)));

  const match = { isActive: true };
  const totalInDb = await Post.countDocuments(match);

  const maxFetch = Math.min(1000, Math.max(200, Number(process.env.FEED_MAX_CANDIDATES || 400)));
  const dynamicWindow = Math.max(100, page * limit * 6);
  const fetchLimit = Math.min(maxFetch, totalInDb, dynamicWindow);

  // Fetch globally recent posts to rank (since feed is interest-driven now, not just network-driven)
  const recentPosts = await Post.find(match)
    .populate("author", "name username profilePicture")
    .sort({ createdAt: -1 })
    .limit(fetchLimit);

  const postIds = recentPosts.map((p) => p._id);
  const userLikes = await Like.find({
    userId,
    targetId: { $in: postIds },
    targetType: "Post",
  }).select("targetId");
  const likedSet = new Set(userLikes.map((l) => String(l.targetId)));

  const scored = recentPosts
    .map((p) => ({ post: p, score: computeScore(p, user, followingSet) }))
    .sort((a, b) => b.score - a.score || new Date(b.post.createdAt) - new Date(a.post.createdAt));

  const start = (page - 1) * limit;
  const paged = scored.slice(start, start + limit).map((x) => ({
    ...x.post.toObject(),
    score: x.score,
    isLiked: likedSet.has(String(x.post._id)),
  }));

  const hasMore = start + paged.length < scored.length;
  const truncated = totalInDb > fetchLimit;

  return res.status(200).json({
    message: "Personalized feed fetched successfully",
    page,
    limit,
    total: scored.length,
    hasMore,
    truncated,
    posts: paged,
  });
});
