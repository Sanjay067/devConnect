import Post from "./posts.model.js";

export const updatePostScoreAsync = async (postDoc) => {
  try {
    const likeScore = Math.log1p(postDoc.likeCount || 0) * 2;
    const commentScore = Math.log1p(postDoc.commentCount || 0) * 3;

    const createdAt = postDoc.createdAt ? new Date(postDoc.createdAt).getTime() : Date.now();
    const ageHours = Math.max(0, (Date.now() - createdAt) / (1000 * 60 * 60));
    const recencyScore = 1 / (1 + ageHours / 6);

    const baselineScore = likeScore + commentScore + recencyScore;

    await Post.updateOne({ _id: postDoc._id }, { $set: { score: baselineScore } });
  } catch (error) {
    console.error(`[Background Task] Failed to update score for post ${postDoc?._id}:`, error);
  }
};
