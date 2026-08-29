const pool = require("../config/db");

// ===============================
// DISTANCE HELPER
// ===============================
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// ===============================
// UPDATE / CREATE RISK ZONE
// ===============================
async function updateRiskZone(latitude, longitude, severityScore) {
  console.log("📍 [riskZone] Updating zone:", {
    latitude,
    longitude,
    severityScore,
  });

  // ============================
  // PREDICT PEAK TIME (NEW)
  // ============================
  const hour = new Date().getHours();

  let predictedPeakTime = "unknown";

  if (hour >= 18 && hour <= 23) {
    predictedPeakTime = "night peak";
  } else if (hour >= 12 && hour < 18) {
    predictedPeakTime = "afternoon peak";
  } else {
    predictedPeakTime = "morning peak";
  }

  // ============================
  // FIND NEARBY ZONE
  // ============================
  const zones = await pool.query(`SELECT * FROM risk_zones`);

  let foundZone = null;

  for (let zone of zones.rows) {
    const dist = getDistance(
      latitude,
      longitude,
      zone.latitude,
      zone.longitude
    );

    if (dist < 1) {
      foundZone = zone;
      break;
    }
  }

  // ============================
  // UPDATE EXISTING ZONE
  // ============================
  if (foundZone) {
    const newCount = (foundZone.incident_count || 1) + 1;

    let riskLevel = "low";

    if (newCount >= 10 || severityScore >= 4) {
      riskLevel = "high";
    } else if (newCount >= 5) {
      riskLevel = "medium";
    }

    await pool.query(
      `UPDATE risk_zones 
       SET incident_count = $1,
           risk_level = $2,
           predicted_peak_time = $3
       WHERE id = $4`,
      [newCount, riskLevel, predictedPeakTime, foundZone.id]
    );

    console.log("🔁 [riskZone] Updated existing zone:", foundZone.id);

    return {
      updated: true,
      riskLevel,
      predictedPeakTime,
    };
  }

  // ============================
  // CREATE NEW ZONE
  // ============================
  const riskLevel = severityScore >= 4 ? "high" : "low";

  await pool.query(
    `INSERT INTO risk_zones 
     (latitude, longitude, risk_level, predicted_peak_time)
     VALUES ($1, $2, $3, $4)`,
    [latitude, longitude, riskLevel, predictedPeakTime]
  );

  console.log("🆕 [riskZone] New zone created");

  return {
    created: true,
    riskLevel,
    predictedPeakTime,
  };
}

module.exports = { updateRiskZone };