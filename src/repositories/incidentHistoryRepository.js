const pool = require("../config/db");

async function logIncidentHistory({
  alertId,
  latitude,
  longitude,
  incidentType,
  severityLevel,
}) {
  console.log("📊 [incident_history] Saving incident:", {
    alertId,
    incidentType,
    severityLevel,
  });

  const query = `
    INSERT INTO incident_history
    (alert_id, latitude, longitude, incident_type, severity_level, occurred_at)
    VALUES ($1, $2, $3, $4, $5, NOW())
  `;

  await pool.query(query, [
    alertId,
    latitude,
    longitude,
    incidentType,
    severityLevel,
  ]);

  console.log("✅ [incident_history] Saved");
}

module.exports = { logIncidentHistory };