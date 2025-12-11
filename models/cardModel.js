// models/cardModel.js
const mongoose = require("mongoose");

const CardSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true },
    description: { type: String, trim: true },
    imageUrl: { type: String }, // cover/thumbnail
    templateData: { type: mongoose.Schema.Types.Mixed }, // e.g. positions, colors, fonts, placeholder text
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    }, // null -> marketplace/default
    type: {
      type: String,
      enum: ["default", "official", "marketplace", "user"],
      default: "user",
    },
    isDynamic: { type: Boolean, default: false },
    isPublic: { type: Boolean, default: true },
    stats: {
      likes: { type: Number, default: 0 },
      downloads: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

CardSchema.index({ creator: 1 });
module.exports = mongoose.models.Card || mongoose.model("Card", CardSchema);
