const express = require('express');
const InboxNotification = require('../models/InboxNotification');

function fail(res, status, code, message) {
  return res.status(status).json({ status: 'error', code, message });
}

module.exports = function createNotificationRoutes({ requireAuth }) {
  const router = express.Router();

  /* Unread count for the dot on the bell */
  router.get('/summary', requireAuth, async function (req, res) {
    try {
      const unread = await InboxNotification.countDocuments({ userId: req.authUser._id, readAt: null });
      return res.status(200).json({ status: 'success', data: { unread } });
    } catch (error) {
      console.error('Notification summary error:', error);
      return fail(res, 500, 'NOTIFICATION_SUMMARY_FAILED', 'Unable to load notifications.');
    }
  });

  /* Latest 30 notifications */
  router.get('/', requireAuth, async function (req, res) {
    try {
      const items = await InboxNotification.find({ userId: req.authUser._id })
        .sort({ createdAt: -1 })
        .limit(30);

      return res.status(200).json({
        status: 'success',
        data: {
          notifications: items.map(function (n) {
            return { id: n._id.toString(), title: n.title, body: n.body, createdAt: n.createdAt, unread: !n.readAt };
          })
        }
      });
    } catch (error) {
      console.error('Notification list error:', error);
      return fail(res, 500, 'NOTIFICATION_LIST_FAILED', 'Unable to load notifications.');
    }
  });

  /* Mark everything as read */
  router.post('/read', requireAuth, async function (req, res) {
    try {
      await InboxNotification.updateMany(
        { userId: req.authUser._id, readAt: null },
        { $set: { readAt: new Date() } }
      );
      return res.status(200).json({ status: 'success' });
    } catch (error) {
      console.error('Notification read error:', error);
      return fail(res, 500, 'NOTIFICATION_READ_FAILED', 'Unable to update notifications.');
    }
  });

  return router;
};
