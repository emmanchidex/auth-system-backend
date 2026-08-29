const router = require("express").Router();
const { getNotifications } = require("../controllers/notificationController");

router.get("/:receiverType/:receiverId", getNotifications);

module.exports = router;