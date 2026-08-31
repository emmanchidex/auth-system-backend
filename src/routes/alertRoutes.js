const express = require("express");
const router = express.Router();

const {
  getAlerts,
  getAlertById,
  createAlert,
  getStudentAlerts,
  updateAlertLocation,
  cancelAlert // 👈 Added import
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

router.put("/alerts/:id/cancel", cancelAlert); // 👈 Added route

module.exports = router;