const express = require("express");
const router = express.Router();


const alertController = require("../controllers/alertController");

// =========================
// GET STUDENT NOTIFICATIONS
// =========================


router.get(
  "/safety-recommendations/:studentId",
  alertController.getSafetyRecommendation
);
module.exports = router;