import Post from "./posts.model.js";

export const updatePostScoreAsync = async (postDoc) => {
  try {
    // Protect against negative numbers which cause Math.log1p to return NaN or -Infinity
    const safeLikeCount = Math.max(0, postDoc.likeCount || 0);
    const safeCommentCount = Math.max(0, postDoc.commentCount || 0);

    const likeScore = Math.log1p(safeLikeCount) * 2;
    const commentScore = Math.log1p(safeCommentCount) * 3;

    const createdAt = postDoc.createdAt ? new Date(postDoc.createdAt).getTime() : Date.now();
    const ageHours = Math.max(0, (Date.now() - createdAt) / (1000 * 60 * 60));
    const recencyScore = 1 / (1 + ageHours / 6);

    let baselineScore = likeScore + commentScore + recencyScore;
    
    // Final safety check to prevent DB crashes
    if (Number.isNaN(baselineScore)) {
        baselineScore = 0;
    }

    await Post.updateOne({ _id: postDoc._id }, { $set: { score: baselineScore } });
  } catch (error) {
    console.error(`[Background Task] Failed to update score for post ${postDoc?._id}:`, error);
  }
};
