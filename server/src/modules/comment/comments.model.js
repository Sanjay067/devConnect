import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    body: {
      type: String,
      required: function () {
        return !this.isDeleted;
      },
      trim: true,
      maxlength: 1000,
    },


    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },


    replyCount: {
      type: Number,
      default: 0,
    },

    likeCount: {
      type: Number,
      default: 0,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);


commentSchema.index({ postId: 1, parentComment: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1, createdAt: -1 });

export default mongoose.model("Comment", commentSchema);