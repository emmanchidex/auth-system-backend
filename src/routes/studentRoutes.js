const express = require("express");
const router = express.Router();

const controller = require("../controllers/studentController");
const alertController = require("../controllers/alertController");

// =========================
// GET STUDENT NOTIFICATIONS
// =========================
router.get("/notifications/:studentId", controller.getNotifications);

router.get(
  "/safety/:registrationNumber",
  alertController.getSafetyRecommendation
);

module.exports = router;