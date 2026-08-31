const express = require("express");
const router = express.Router();
const { assignResponder } = require("../services/assignmentService");
const { cancelAlert } = require("../models/alertModel"); // 👈 Update path to where your database functions are located

router.post("/:alertId", async (req, res) => {
  const { alertId } = req.params;

  console.log("📡 [API] Assign request received:", {
    alertId,
    method: req.method,
    path: req.originalUrl,
    time: new Date().toISOString(),
  });

  try {
    const result = await assignResponder(alertId);

    console.log("✅ [API] Assignment successful:", {
      alertId,
      primary: result.primary,
      backups: result.backups,
    });

    res.json(result);
  } catch (err) {
    console.error("❌ [API] Assignment failed:", {
      alertId,
      error: err.message,
    });

    res.status(500).json({ error: err.message });
  }
});

// =========================
// CANCEL ALERT ENDPOINT
// =========================
router.put("/:id/cancel", async (req, res) => {
  const { id } = req.params;

  console.log("📡 [API] Cancel alert request received:", {
    alertId: id,
    time: new Date().toISOString(),
  });

  try {
    const updatedAlert = await cancelAlert(id);

    if (!updatedAlert) {
      return res.status(404).json({ success: false, message: "Alert not found" });
    }

    console.log("✅ [API] Alert cancelled successfully:", { alertId: id });

    res.json({
      success: true,
      message: "Alert cancelled successfully",
      data: updatedAlert,
    });
  } catch (err) {
    console.error("❌ [API] Cancel alert failed:", {
      alertId: id,
      error: err.message,
    });

    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;