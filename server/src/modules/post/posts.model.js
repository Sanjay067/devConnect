import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      trim: true,
      required: true,
      maxlength: 200,
    },
    authorName: String,
    authorUsername: String,
    authorProfilePicture: String,

    shortDescription: {
      type: String,
      trim: true,
      maxlength: 300,
    },

    content: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    media: [
      {
        url: String,
        publicId: String,
        type: {
          type: String,
          enum: ["image", "video", "file"],
          required: true,
        },
      },
    ],
    links: [
      {
        url: String,
        label: String,
      }
    ],

    techStack: [
      {
        type: String,
        trim: true,
      }
    ],

    lookingForContributors: {
      type: Boolean,
      default: false,
    },

    likeCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },

    score: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);


postSchema.index({ author: 1, isActive: 1, score: -1 });
postSchema.index({ isActive: 1, score: -1 });

export default mongoose.model("Post", postSchema);