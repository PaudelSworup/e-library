const express = require("express");
const {
  sendNotifications,
  updateStatus,
  sendNotificationsToALl,
} = require("../../controllers/notificationController.js/notificationController");
const router = express.Router();

router.get("/notifications/:id", sendNotifications);
router.put("/notifications/:id", updateStatus);
router.get("/booksnotification/:id", sendNotificationsToALl);

module.exports = router;
