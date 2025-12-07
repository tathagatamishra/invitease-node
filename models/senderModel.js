// models/senderModel.js
const mongoose = require('mongoose');

const LoginMethods = ['google', 'facebook', 'linkedin', 'email', 'whatsapp'];

const SenderSchema = new mongoose.Schema({
  // unique username for the sender (visible when inviting by whatsapp)
  username: { type: String, trim: true, unique: true, sparse: true },

  // public profile
  fullName: { type: String, trim: true },
  email: { type: String, lowercase: true, trim: true, unique: true, sparse: true },

  // only one phone field: WhatsApp number (string, canonicalized by controllers)
  whatsappNumber: { type: String, required: true, unique: true, trim: true },

  profileImage: { type: String },

  // which method used to signup/login
  loginMethod: { type: String, enum: LoginMethods, default: 'whatsapp' },
  verified: { type: Boolean, default: false },

  // hashed password (if any)
  password: { type: String },

  // Social provider ids
  providerId: {
    google: { type: String },
    facebook: { type: String },
    linkedin: { type: String }
  },

  // session / whatsapp connection metadata if you connect for sending
  whatsappConnected: { type: Boolean, default: false },
  whatsappSessionMeta: { type: mongoose.Schema.Types.Mixed },

  // convenience: events created by this sender
  // (not required, you can also query Event by sender)
  metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

// Indexes
SenderSchema.index({ whatsappNumber: 1 }, { unique: true, sparse: true });
SenderSchema.index({ email: 1 }, { sparse: true });

// Example helper: find sender by whatsapp number
SenderSchema.statics.findByWhatsApp = async function(number) {
  return this.findOne({ whatsappNumber: number });
};

module.exports = mongoose.models.Sender || mongoose.model('Sender', SenderSchema);
