// models/userModel.js
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const SALT_ROUNDS = 12;

const OAuthSchema = new mongoose.Schema({
  provider: { type: String },
  providerId: { type: String }
}, { _id: false });

const ContactSchema = new mongoose.Schema({
  name: String,
  phone: String,
  userRef: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  addedAt: { type: Date, default: Date.now },
  notes: String
}, { _id: false });

const UserSchema = new mongoose.Schema({
  username: { type: String, trim: true, unique: true, sparse: true },
  fullName: { type: String, trim: true },
  email: { type: String, lowercase: true, trim: true, unique: true, sparse: true },
  phone: { type: String, trim: true, unique: true, sparse: true },
  role: { type: String, enum: ['receiver', 'sender', 'both'], default: 'receiver' },
  loginMethods: [{ type: String }], // e.g. ['email','google']
  oauth: [OAuthSchema],
  verified: { type: Boolean, default: false },
  passwordHash: { type: String },
  profileImage: { type: String },
  isWhatsAppConnected: { type: Boolean, default: false },
  whatsappSession: { type: mongoose.Schema.Types.Mixed, default: null },
  lastWhatsAppSync: { type: Date },
  contacts: [ContactSchema],
  attendedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
  createdEventsCount: { type: Number, default: 0 }
}, { timestamps: true });

UserSchema.methods.setPassword = async function (plain) {
  this.passwordHash = await bcrypt.hash(plain, SALT_ROUNDS);
};

UserSchema.methods.checkPassword = async function (plain) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(plain, this.passwordHash);
};

UserSchema.methods.safeObject = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.whatsappSession;
  return obj;
};

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
