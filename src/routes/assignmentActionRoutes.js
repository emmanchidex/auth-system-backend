const router = require("express").Router();

const {
  acceptAssignment,
  rejectAssignment,
  completeAssignment,
} = require("../repositories/assignmentRepository");

// =========================
// ACCEPT ASSIGNMENT
// =========================
router.post("/accept", async (req, res) => {
  try {
    const { alertId, securityId } = req.body;

    console.log("✅ [ACTION] Accept request:", { alertId, securityId });

    const result = await acceptAssignment(alertId, securityId);

    res.json({
      success: true,
      message: "Accepted",
      data: result,
    });
  } catch (err) {
    console.error("❌ Accept error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// =========================
// REJECT ASSIGNMENT
// =========================
router.post("/reject", async (req, res) => {
  try {
    const { alertId, securityId } = req.body;

    console.log("❌ [ACTION] Reject request:", { alertId, securityId });

    const result = await rejectAssignment(alertId, securityId);

    res.json({
      success: true,
      message: "Rejected",
      data: result,
    });
  } catch (err) {
    console.error("❌ Reject error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// =========================
// COMPLETE ASSIGNMENT
// =========================
router.post("/complete", async (req, res) => {
  try {
    const { alertId, securityId } = req.body;

    console.log("🏁 [ACTION] Complete request:", { alertId, securityId });

    const result = await completeAssignment(alertId, securityId);

    res.json({
      success: true,
      message: "Completed",
      data: result,
    });
  } catch (err) {
    console.error("❌ Complete error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;