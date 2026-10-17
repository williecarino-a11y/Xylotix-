const mongoose = require('mongoose');

const inboxNotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, maxlength: 120 },
  body: { type: String, default: '', maxlength: 400 },
  readAt: { type: Date, default: null },
  // Notifications delete themselves after 60 days
  createdAt: { type: Date, default: Date.now, expires: 60 * 24 * 60 * 60 }
});

inboxNotificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('InboxNotification', inboxNotificationSchema);
