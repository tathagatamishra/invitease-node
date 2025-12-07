// models/eventModel.js
const mongoose = require('mongoose');

/**
 * EventGuest entry semantics:
 * - For an invited whatsapp number we store:
 *    - whatsappNumber (string, canonical)
 *    - accepted (boolean)
 *    - acceptedAt (date)
 *    - guestType: 'sender' | 'receiver' | 'external' (external = not found in db)
 *    - senderRef: optional ObjectId -> Sender (if the number belongs to a Sender)
 *    - receiverRef: optional ObjectId -> Receiver (if the number belongs to a Receiver)
 *    - snapshot: a small object { username, fullName, profileImage } copied at invite time
 *
 * This allows:
 * - When a sender adds another sender's whatsapp number, the UI can show that sender's name/profile (via senderRef).
 * - If the receiver edited his profile but hasn't converted, the snapshot will show updated info at last invite.
 */

/* Gallery image subdoc */
const EventGalleryImageSchema = new mongoose.Schema({
  uploaderType: { type: String, enum: ['Sender', 'Receiver'], required: true },
  uploaderRef: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'gallery.uploaderType' },
  imageUrl: { type: String, required: true },
  imageTitle: { type: String },
  imageDescription: { type: String },
  likeCount: { type: Number, default: 0 },
  shareCount: { type: Number, default: 0 },
  uploadedAt: { type: Date, default: Date.now }
}, { _id: true });

/* Guest subdoc */
const EventGuestSchema = new mongoose.Schema({
  whatsappNumber: { type: String, required: true, trim: true },
  guestType: { type: String, enum: ['sender', 'receiver', 'external'], default: 'external' },
  senderRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Sender', default: null },
  receiverRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Receiver', default: null },

  // snapshot of profile shown to sender during invite (keeps last known profile)
  snapshot: {
    username: { type: String },
    fullName: { type: String },
    profileImage: { type: String }
  },

  // accepted flag (false initially)
  accepted: { type: Boolean, default: false },
  invitedAt: { type: Date, default: Date.now },
  acceptedAt: { type: Date, default: null }
}, { _id: true });

const EventSchema = new mongoose.Schema({
  // Unique 10-character alphanumeric string
  eventId: { type: String, required: true, unique: true, minlength: 10, maxlength: 10 },

  // owner (sender)
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'Sender', required: true },

  eventTitle: { type: String, required: true },
  description: { type: String },

  coverImageUrl: { type: String },
  invitationCard: { type: mongoose.Schema.Types.ObjectId, ref: 'InvitationCard' },
  invitationMessage: { type: String },

  // Guests (array of subdocs)
  guests: [EventGuestSchema],

  eventStartTime: { type: Date },
  eventEndTime: { type: Date },

  // gallery: receivers (even non-converted) may upload; uploaderType + uploaderRef used
  gallery: [EventGalleryImageSchema],

  // chat room id (can be an external collection)
  chatRoomId: { type: String },

  archived: { type: Boolean, default: false },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

// Indexes
EventSchema.index({ eventId: 1 }, { unique: true });
EventSchema.index({ sender: 1 });

/**
 * Helper: add guest by whatsapp number.
 * - finds existing Sender or Receiver
 * - sets guestType, senderRef/receiverRef accordingly
 * - stores a snapshot so that UI can show name/profile if available
 *
 * Usage: await event.addGuestByWhatsApp(number, { SenderModel, ReceiverModel, snapshotOverride });
 */
EventSchema.methods.addGuestByWhatsApp = async function (whatsappNumber, { SenderModel, ReceiverModel, snapshotOverride = {} } = {}) {
  // canonicalize number outside
  const normalized = whatsappNumber;

  // don't add duplicates
  if (this.guests.some(g => g.whatsappNumber === normalized)) {
    return this.guests.find(g => g.whatsappNumber === normalized);
  }

  let sender = null;
  let receiver = null;
  if (SenderModel) sender = await SenderModel.findOne({ whatsappNumber: normalized });
  if (!sender && ReceiverModel) receiver = await ReceiverModel.findOne({ whatsappNumber: normalized });

  const guest = {
    whatsappNumber: normalized,
    guestType: sender ? 'sender' : (receiver ? 'receiver' : 'external'),
    senderRef: sender ? sender._id : null,
    receiverRef: receiver ? receiver._id : null,
    snapshot: {
      username: (sender && sender.username) || (receiver && receiver.username) || snapshotOverride.username || null,
      fullName: (sender && sender.fullName) || (receiver && receiver.fullName) || snapshotOverride.fullName || null,
      profileImage: (sender && sender.profileImage) || (receiver && receiver.profileImage) || snapshotOverride.profileImage || null
    },
    accepted: false,
    invitedAt: new Date()
  };

  this.guests.push(guest);
  await this.save();

  return this.guests[this.guests.length - 1];
};

/**
 * Mark a guest accepted (called when guest clicks link)
 * - if receiver doesn't exist, create a Receiver
 * - if receiver exists, link them and set accepted
 */
EventSchema.methods.markGuestAccepted = async function (whatsappNumber, { ReceiverModel } = {}) {
  const normalized = whatsappNumber;

  const guest = this.guests.find(g => g.whatsappNumber === normalized);
  if (!guest) return null;

  // find or create receiver
  let receiver = null;
  if (ReceiverModel) receiver = await ReceiverModel.findOne({ whatsappNumber: normalized });
  if (!receiver && ReceiverModel) {
    receiver = await ReceiverModel.create({
      whatsappNumber: normalized,
      fullName: guest.snapshot?.fullName || undefined,
      username: guest.snapshot?.username || undefined,
      profileImage: guest.snapshot?.profileImage || undefined,
      createdFromInvitation: true
    });
  }

  guest.accepted = true;
  guest.acceptedAt = new Date();
  if (receiver) {
    guest.receiverRef = receiver._id;
    // if guest was previously marked senderRef pointing to a Sender, keep it (they may be both)
    guest.guestType = guest.senderRef ? 'sender' : 'receiver';
  }

  await this.save();
  return guest;
};

/**
 * Convenience: find guests that are accepted for access control
 */
EventSchema.methods.isAccessAllowed = function (user) {
  // user is a Sender or Receiver mongoose doc with whatsappNumber or _id
  if (!user) return false;
  // senders: if user is sender owner or a sender with accepted guest entry
  if (user.schema && user.schema === mongoose.model('Sender').schema) {
    if (this.sender && this.sender.toString() === user._id.toString()) return true;
    return this.guests.some(g => g.senderRef && g.senderRef.toString() === user._id.toString() && g.accepted);
  }
  // receivers: check by receiverRef or whatsappNumber
  if (user.schema && user.schema === mongoose.model('Receiver').schema) {
    return this.guests.some(g => (g.receiverRef && g.receiverRef.toString() === user._id.toString()) && g.accepted);
  }
  // fallback: if user object has whatsappNumber property
  if (user.whatsappNumber) {
    return this.guests.some(g => g.whatsappNumber === user.whatsappNumber && g.accepted);
  }
  return false;
};

module.exports = mongoose.models.Event || mongoose.model('Event', EventSchema);
