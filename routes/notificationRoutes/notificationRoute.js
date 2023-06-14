const express = require("express");
const {
  sendNotifications, updateStatus,
} = require("../../controllers/notificationController.js/notificationController");
const router = express.Router();

router.get("/notifications/:id", sendNotifications);
router.put("/notifications/:id" , updateStatus)

module.exports = router;
