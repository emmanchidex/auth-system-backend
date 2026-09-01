const router = require("express").Router();
const pool = require("../config/db"); // 🔌 Import your database pool
const { getIO } = require("../socket"); // 🔌 Import socket instance

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

    // ⚡ ADDED: Notify student via WebSockets
    try {
      const io = getIO();
      const alertRecord = await pool.query(
        "SELECT s.user_id AS student_id FROM alerts a JOIN students s ON a.student_id = s.id WHERE a.id = $1",
        [alertId]
      );

      if (alertRecord.rows.length > 0) {
        const studentId = alertRecord.rows[0].student_id;
        const studentTokenRoom = `student_${studentId}`;
        const alertRoom = `alert_${alertId}`;

        io.to(studentTokenRoom).emit("security_accepted", {
          alertId,
          securityId,
          status: "accepted",
          message: "Security has accepted your alert. Starting live location sync."
        });

        io.in(studentTokenRoom).socketsJoin(alertRoom);
        console.log(`🛡️ REST ACCEPT → Notified student token room: ${studentTokenRoom} and joined ${alertRoom}`);
      }
    } catch (socketErr) {
      console.error("❌ Failed to emit socket event in accept route:", socketErr);
    }

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