const express = require("express");
const router = express.Router();
const { assignResponder } = require("../services/assignmentService");


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



module.exports = router;