const pool = require("../config/db");

async function generateSafetyRecommendation(studentId, riskLevel) {
  console.log("🛡️ [safety] Generating recommendation:", {
    studentId,
    riskLevel,
  });

  let message = "";

  if (riskLevel === "high") {
    message = "⚠️ High risk detected in your area. Avoid movement and stay safe indoors.";
  } else if (riskLevel === "medium") {
    message = "⚠️ Caution advised. Stay alert and avoid isolated areas.";
  } else {
    message = "✅ Low risk. Stay aware and follow safety guidelines.";
  }

  const query = `
    INSERT INTO safety_recommendations
    (student_id, message, risk_level)
    VALUES ($1, $2, $3)
  `;

  await pool.query(query, [studentId, message, riskLevel]);

  console.log("✅ [safety] Recommendation saved");

  return message;
}

module.exports = { generateSafetyRecommendation };