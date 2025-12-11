// models/GalleryModel.js
const mongoose = require("mongoose");

const GallerySchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    uploader: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    image: { type: String, required: true },
    // store the image’s width and height so that in the frontend I can set placeholders with the correct aspect ratio before the image loads.
    width: {
      type: Number,
      required: true,
    },
    height: {
      type: Number,
      required: true,
    },
    title: String,
    description: String,
    likeCount: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

GallerySchema.index({ event: 1, uploader: 1 });
module.exports = mongoose.model("Gallery", GallerySchema);
