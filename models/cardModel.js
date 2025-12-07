// models/cardModel.js
const mongoose = require('mongoose');

const CardSchema = new mongoose.Schema({
  cardId: { type: String, trim: true, unique: true, sparse: true }, // optional short id
  imageUrl: { type: String },
  cardTitle: { type: String },
  description: { type: String },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Sender' }, // who created the card
  metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

module.exports = mongoose.models.InvitationCard || mongoose.model('InvitationCard', CardSchema);
