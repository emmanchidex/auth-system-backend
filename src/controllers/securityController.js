const {
  getSecurityIdByNumber,
  getAssignmentsBySecurity,
  getNotificationsBySecurity,
} = require("../repositories/securityRepository");

// =========================
// GET ASSIGNMENTS
// =========================
exports.getAssignments = async (req, res) => {
  const startTime = Date.now();

  try {
    const { securityId } = req.params; // this is SECURITY NUMBER

    console.log("📥 [getAssignments] Request received", {
      securityNumber: securityId,
      time: new Date().toISOString(),
      ip: req.ip,
    });

    // 🔥 convert security number → real ID
    const realSecurityId = await getSecurityIdByNumber(securityId);

    if (!realSecurityId) {
      return res.status(404).json({
        error: "Security not found",
      });
    }

    const data = await getAssignmentsBySecurity(realSecurityId);

    console.log("📤 [getAssignments] Response ready", {
      securityNumber: securityId,
      securityId: realSecurityId,
      count: data?.length || 0,
      duration: `${Date.now() - startTime}ms`,
    });

    res.json(data);
  } catch (error) {
    console.error("❌ [getAssignments] ERROR", {
      message: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      error: "Failed to fetch assignments",
      details: error.message,
    });
  }
};

// =========================
// GET NOTIFICATIONS
// =========================
exports.getNotifications = async (req, res) => {
  const startTime = Date.now();

  try {
    const { securityId } = req.params; // security NUMBER

    console.log("📥 [getNotifications] Request received", {
      securityNumber: securityId,
      time: new Date().toISOString(),
      ip: req.ip,
    });

    const realSecurityId = await getSecurityIdByNumber(securityId);

    if (!realSecurityId) {
      return res.status(404).json({
        error: "Security not found",
      });
    }

    const data = await getNotificationsBySecurity(realSecurityId);

    console.log("📤 [getNotifications] Response ready", {
      securityNumber: securityId,
      securityId: realSecurityId,
      count: data?.length || 0,
      duration: `${Date.now() - startTime}ms`,
    });

    res.json(data);
  } catch (error) {
    console.error("❌ [getNotifications] ERROR", {
      message: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      error: "Failed to fetch notifications",
      details: error.message,
    });
  }
};