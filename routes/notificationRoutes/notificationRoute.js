const express = require("express");
const {
  sendNotifications, updateStatus,
} = require("../../controllers/notificationController.js/notificationController");
const router = express.Router();

router.get("/notifications/:id", sendNotifications);
router.put("/notifications" , updateStatus)

module.exports = router;
