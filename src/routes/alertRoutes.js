const express = require("express");
const router = express.Router();

// ✅ correct import (destructured)
const {
  getAlerts,
  getAlertById,
  createAlert,
  getStudentAlerts,
  updateAlertLocation
} = require("../controllers/alertController");

console.log("🔥 ALERT ROUTES LOADED");

// =====================
// ROUTES
// =====================

router.post("/alerts", createAlert);

router.get("/alerts", getAlerts);

router.get("/alerts/:id", getAlertById);

router.get("/alerts/student/:registrationNumber", getStudentAlerts);

router.put("/alerts/:id/location", updateAlertLocation);

module.exports = router;