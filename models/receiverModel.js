// models/receiverModel.js
const mongoose = require('mongoose');

/**
 * Receivers are NOT main users. They are lightweight invitee records.
 * They require a whatsappNumber only (no extra mobile field).
 * They can edit their profile (name, username, profileImage) without converting.
 * To use all features they must convert to a Sender (see convertToSender helper).
 */

const ReceiverSchema = new mongoose.Schema({
  // Required whatsapp number (unique)
  whatsappNumber: { type: String, required: true, unique: true, trim: true },

  // Profile fields that a receiver can edit (even if not converted)
  fullName: { type: String, trim: true },
  username: { type: String, trim: true, sparse: true },
  profileImage: { type: String },

  // createdFromInvitation true if created through invite link
  createdFromInvitation: { type: Boolean, default: true },

  // flag if this receiver has converted into a Sender
  convertedToSender: { type: Boolean, default: false },

  // If converted, keep reference to the newly created Sender
  linkedSender: { type: mongoose.Schema.Types.ObjectId, ref: 'Sender', default: null },

  // metadata / preferences
  metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

ReceiverSchema.index({ whatsappNumber: 1 }, { unique: true });

// convert receiver into sender convenience method (controller should call inside transaction)
ReceiverSchema.methods.convertToSender = async function (SenderModel, override = {}) {
  if (this.convertedToSender && this.linkedSender) {
    return SenderModel.findById(this.linkedSender);
  }

  const senderData = {
    username: this.username || override.username,
    fullName: this.fullName || override.fullName,
    whatsappNumber: this.whatsappNumber,
    profileImage: this.profileImage || override.profileImage,
    loginMethod: 'whatsapp',
    verified: false, // keep false until sender verifies
    ...override
  };

  // create Sender
  const newSender = await SenderModel.create(senderData);

  // update receiver
  this.convertedToSender = true;
  this.linkedSender = newSender._id;
  await this.save();

  return newSender;
};

module.exports = mongoose.models.Receiver || mongoose.model('Receiver', ReceiverSchema);
