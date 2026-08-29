const express = require("express");
const router = express.Router();

const controller = require("../controllers/securityController");

// 📥 Get assignments
router.get("/assignments/:securityId", controller.getAssignments);

// 🔔 Get notifications
router.get("/notifications/:securityId", controller.getNotifications);

module.exports = router;