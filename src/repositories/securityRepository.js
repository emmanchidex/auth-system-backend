const pool = require("../config/db");

// =========================
// GET SECURITY ID BY NUMBER
// =========================
async function getSecurityIdByNumber(securityNumber) {
  console.log("🔎 [securityRepository] getSecurityIdByNumber:", {
    securityNumber,
  });

  const { rows } = await pool.query(
    `
    SELECT id 
    FROM security 
    WHERE security_number = $1
    `,
    [securityNumber]
  );

  const securityId = rows[0]?.id;

  console.log("🆔 [securityRepository] resolved securityId:", securityId);

  return securityId;
}

// =========================
// GET ASSIGNMENTS BY SECURITY
// =========================
async function getAssignmentsBySecurity(securityId) {
  console.log("📥 [securityRepository] getAssignmentsBySecurity:", {
    securityId,
  });

  const { rows } = await pool.query(
    `
    SELECT 
      aa.*,
      a.description,
      a.status as alert_status,
      al.latitude,
      al.longitude
    FROM alert_assignments aa
    JOIN alerts a ON aa.alert_id = a.id
    LEFT JOIN alert_locations al ON al.alert_id = a.id
    WHERE aa.security_id = $1
    ORDER BY aa.assigned_at DESC;
    `,
    [securityId]
  );

  console.log("📊 [securityRepository] assignments count:", rows.length);

  return rows;
}

// =========================
// GET NOTIFICATIONS BY SECURITY
// =========================
async function getNotificationsBySecurity(securityId) {
  console.log("📥 [securityRepository] getNotificationsBySecurity:", {
    securityId,
  });

  const { rows } = await pool.query(
    `
    SELECT * 
    FROM notifications
    WHERE receiver_type = 'security'
    AND receiver_id = $1
    ORDER BY created_at DESC;
    `,
    [securityId]
  );

  console.log("📊 [securityRepository] notifications count:", rows.length);

  return rows;
}

// =========================
// EXPORTS
// =========================
module.exports = {
  getSecurityIdByNumber,
  getAssignmentsBySecurity,
  getNotificationsBySecurity,
};