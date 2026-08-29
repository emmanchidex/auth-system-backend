const pool = require("../config/db");

async function getAlertDetails(alertId) {
  console.log("📥 [getAlertDetails] Fetching alert:", { alertId });

  const query = `
    SELECT a.id, sl.score AS severity,
           al.latitude, al.longitude
    FROM alerts a
    JOIN severity_levels sl ON a.severity_id = sl.id
    JOIN alert_locations al ON al.alert_id = a.id
    WHERE a.id = $1
    ORDER BY al.recorded_at DESC
    LIMIT 1;
  `;

  try {
    const { rows } = await pool.query(query, [alertId]);

    if (!rows[0]) {
      console.warn("⚠️ [getAlertDetails] No alert found:", alertId);
      return null;
    }

    console.log("📦 [getAlertDetails] Result:", {
      id: rows[0].id,
      severity: rows[0].severity,
      latitude: rows[0].latitude,
      longitude: rows[0].longitude,
    });

    return rows[0];
  } catch (error) {
    console.error("❌ [getAlertDetails] DB Error:", {
      alertId,
      error: error.message,
    });

    throw error;
  }
}

module.exports = { getAlertDetails };