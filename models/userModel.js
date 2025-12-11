// models/userModel.js
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const SALT_ROUNDS = 12;

const OAuthSchema = new mongoose.Schema(
  {
    provider: { type: String }, // 'google' | 'facebook' | 'linkedin'
    providerId: { type: String },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, unique: true, sparse: true, trim: true },
    fullName: { type: String, trim: true },
    email: {
      type: String,
      lowercase: true,
      unique: true,
      sparse: true,
      trim: true,
    },
    phone: { type: String, unique: true, sparse: true }, // E.164 recommended
    role: {
      type: String,
      enum: ["receiver", "sender", "both"],
      default: "receiver",
    },
    loginMethods: [{ type: String }], // e.g. ['google','email']
    oauth: [OAuthSchema],
    verified: { type: Boolean, default: false },
    passwordHash: { type: String }, // if email/password signup used
    profileImage: { type: String }, // URL
    isWhatsAppConnected: { type: Boolean, default: false },
    whatsappSession: { type: mongoose.Schema.Types.Mixed }, // store session tokens/qr/meta (encrypted at rest in prod)
    lastWhatsAppSync: { type: Date },

    // user quick stats
    attendedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
    createdEventsCount: { type: Number, default: 0 },

    // allow a sender to store contacts (local contact list)
    contacts: [
      {
        name: String,
        phone: String,
        userRef: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },
        addedAt: { type: Date, default: Date.now },
        notes: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

/* Password helpers */
UserSchema.methods.setPassword = async function (plain) {
  this.passwordHash = await bcrypt.hash(plain, SALT_ROUNDS);
};

UserSchema.methods.checkPassword = async function (plain) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(plain, this.passwordHash);
};

/* Small sanitization virtual (do not return sensitive fields) */
UserSchema.methods.safeObject = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.whatsappSession;
  return obj;
};

module.exports = mongoose.models.User || mongoose.model("User", UserSchema);
