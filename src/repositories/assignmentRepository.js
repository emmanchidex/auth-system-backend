const pool = require("../config/db");
const { getIO } = require("../socket");

// =========================
// UPDATE ALERT STATUS
// =========================
async function updateAlertStatus(alertId, status) {
  console.log("🔄 updateAlertStatus:", { alertId, status });

  try {
    await pool.query(
      `UPDATE alerts SET status = $2 WHERE id = $1`,
      [alertId, status]
    );

    console.log("✅ Alert status updated:", { alertId, status });

  } catch (err) {
    console.error("❌ updateAlertStatus ERROR:", err.message);
  }
}

// =========================
// GET SECURITY ID
// =========================
async function getSecurityIdByNumber(securityNumber) {
  console.log("🔎 getSecurityIdByNumber:", securityNumber);

  const { rows } = await pool.query(
    `
    SELECT id FROM security
    WHERE security_number = $1
    LIMIT 1;
    `,
    [securityNumber]
  );

  const id = rows[0]?.id || null;

  console.log("🆔 securityId:", id);

  return id;
}

// =========================
// CREATE ASSIGNMENT
// =========================
async function createAssignment(alertId, securityId, status = "assigned") {
  console.log("📌 createAssignment:", { alertId, securityId, status });

  const { rows } = await pool.query(
    `
    INSERT INTO alert_assignments (alert_id, security_id, status)
    VALUES ($1, $2, $3)
    RETURNING *;
    `,
    [alertId, securityId, status]
  );

  console.log("✅ Assignment created:", rows[0]);

  return rows[0];
}

// =========================
// ACCEPT ASSIGNMENT
// =========================
async function acceptAssignment(alertId, securityNumber) {
  console.log("✅ acceptAssignment START:", { alertId, securityNumber });

  const securityId = await getSecurityIdByNumber(securityNumber);

  if (!securityId) throw new Error("Security not found");

  const { rows } = await pool.query(
    `
    UPDATE alert_assignments
    SET status = 'accepted',
        accepted_at = NOW()
    WHERE alert_id = $1 AND security_id = $2
    RETURNING *;
    `,
    [alertId, securityId]
  );

  await updateAlertStatus(alertId, "accepted");

  // =========================
  // 📡 SOCKET EMIT (START TRACKING)
  // =========================
  const io = getIO();
  const room = `alert_${alertId}`;

  console.log("📡 EMIT start_tracking →", room);

  const payload = {
    event: "start_tracking",
    alertId,
    status: "accepted",
    timestamp: new Date().toISOString(),
  };

  io.to(room).emit("start_tracking", payload);

  console.log("📤 SENT:", payload);

  return rows[0];
}

// =========================
// REJECT ASSIGNMENT
// =========================
async function rejectAssignment(alertId, securityNumber) {
  console.log("❌ rejectAssignment:", { alertId, securityNumber });

  const securityId = await getSecurityIdByNumber(securityNumber);

  if (!securityId) throw new Error("Security not found");

  const { rows } = await pool.query(
    `
    UPDATE alert_assignments
    SET status = 'rejected',
        rejected_at = NOW()
    WHERE alert_id = $1 AND security_id = $2
    RETURNING *;
    `,
    [alertId, securityId]
  );

  await updateAlertStatus(alertId, "rejected");

  const io = getIO();
  const room = `alert_${alertId}`;

  console.log("📡 EMIT stop_tracking →", room);

  const payload = {
    event: "stop_tracking",
    alertId,
    status: "rejected",
    timestamp: new Date().toISOString(),
  };

  io.to(room).emit("stop_tracking", payload);

  console.log("📤 SENT:", payload);

  return rows[0];
}

// =========================
// COMPLETE ASSIGNMENT
// =========================
async function completeAssignment(alertId, securityNumber) {
  console.log("🏁 completeAssignment:", { alertId, securityNumber });

  const securityId = await getSecurityIdByNumber(securityNumber);

  if (!securityId) throw new Error("Security not found");

  const { rows } = await pool.query(
    `
    UPDATE alert_assignments
    SET status = 'completed',
        completed_at = NOW()
    WHERE alert_id = $1
      AND security_id = $2
      AND status = 'accepted'
    RETURNING *;
    `,
    [alertId, securityId]
  );

  if (!rows[0]) throw new Error("Must accept before completing");

  await updateAlertStatus(alertId, "completed");

  const io = getIO();
  const room = `alert_${alertId}`;

  console.log("🛑 EMIT stop_tracking →", room);

  const payload = {
    event: "stop_tracking",
    alertId,
    status: "completed",
    timestamp: new Date().toISOString(),
  };

  io.to(room).emit("stop_tracking", payload);

  console.log("📤 SENT:", payload);

  return rows[0];
}

// =========================
// CANCEL ALERT
// =========================
async function cancelAlert(alertId) {
  console.log("❌ cancelAlert:", { alertId });

  try {
    const { rows } = await pool.query(
      `UPDATE alerts SET status = 'cancelled' WHERE id = $1 RETURNING *;`,
      [alertId]
    );

    console.log("✅ Alert cancelled:", rows[0]);

    const io = getIO();
    const room = `alert_${alertId}`;

    console.log("📡 EMIT stop_tracking (cancelled) →", room);

    const payload = {
      event: "stop_tracking",
      alertId,
      status: "cancelled",
      timestamp: new Date().toISOString(),
    };

    io.to(room).emit("stop_tracking", payload);

    console.log("📤 SENT:", payload);

    return rows[0];
  } catch (err) {
    console.error("❌ cancelAlert ERROR:", err.message);
    throw err;
  }
}

// =========================
// PRIORITY LOG
// =========================
async function logPriority(alertId, priorityScore, severityScore, distanceScore) {
  console.log("🧠 logPriority:", {
    alertId,
    priorityScore,
    severityScore,
    distanceScore,
  });

  await pool.query(
    `
    INSERT INTO alert_priority_logs 
    (alert_id, priority_score, severity_score, distance_score)
    VALUES ($1, $2, $3, $4);
    `,
    [alertId, priorityScore, severityScore, distanceScore]
  );

  console.log("📊 Priority logged");
}

// =========================
// EXPORTS
// =========================
module.exports = {
  createAssignment,
  acceptAssignment,
  rejectAssignment,
  completeAssignment,
  cancelAlert, // 👈 Added export here so your controller can access it
  logPriority,
  getSecurityIdByNumber,
};