const pool = require("../config/db");

// ===============================
// CREATE NOTIFICATION
// ===============================
async function createNotification({
  alertId,
  receiverType,
  receiverId,
  message,
}) {
  console.log("🔔 [notification] Creating:", {
    alertId,
    receiverType,
    receiverId,
    message,
  });

  const query = `
    INSERT INTO notifications 
    (alert_id, receiver_type, receiver_id, message)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;

  const { rows } = await pool.query(query, [
    alertId,
    receiverType,
    receiverId,
    message,
  ]);

  console.log("✅ [notification] Saved:", rows[0]);

  return rows[0];
}

module.exports = { createNotification };