// models/eventModel.js
const mongoose = require("mongoose");
const crypto = require("crypto");

const GuestSchema = new mongoose.Schema(
  {
    // allow guest to be a userRef (if user exists) or just phone/name for non-registered receivers
    userRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    name: { type: String, trim: true },
    phone: { type: String, required: true }, // phone invited
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // who added them
    invitedAt: { type: Date, default: Date.now },
    accepted: { type: Boolean, default: false },
    acceptedAt: { type: Date, default: null },
    roleWhenInvited: {
      type: String,
      enum: ["receiver", "sender", "both"],
      default: "receiver",
    },
    // track how the invite was sent: 'auto' | 'manual' (copy/paste) | 'whatsapp-session' etc
    sendMethod: { type: String, default: "manual" },
  },
  { _id: true }
);

const GalleryImageSchema = new mongoose.Schema(
  {
    uploader: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    url: { type: String, required: true },
    title: String,
    description: String,
    likeCount: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const EventSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, index: true }, // 10-char alphanumeric
    title: { type: String, trim: true },
    description: { type: String, trim: true },
    coverImage: { type: String },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    invitationCard: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Card",
      default: null,
    },
    invitationMessage: { type: String }, // message body sent to guests

    guests: [GuestSchema],
    gallery: [GalleryImageSchema],

    startAt: { type: Date },
    endAt: { type: Date },

    isPublic: { type: Boolean, default: false }, // default private (only invited)
    chatRoomId: { type: String, default: null },

    stats: {
      views: { type: Number, default: 0 },
      acceptedCount: { type: Number, default: 0 },
      likedCount: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

/* Generate a random unique code (10 alnum). Use before creating event */
EventSchema.statics.generateUniqueCode = async function (len = 10) {
  const Model = this;
  const tryCode = () =>
    crypto
      .randomBytes(Math.ceil(len / 2))
      .toString("hex")
      .slice(0, len)
      .toUpperCase();
  // attempt a few times
  for (let i = 0; i < 6; i++) {
    const code = tryCode();
    const exists = await Model.exists({ code });
    if (!exists) return code;
  }
  // fallback deterministic
  return `${Date.now().toString(36).toUpperCase()}`.slice(-len);
};

EventSchema.index({ creator: 1, code: 1 });
module.exports = mongoose.models.Event || mongoose.model("Event", EventSchema);
