const pool = require('../config/db');
const { getSeverityScore } = require("../utils/severity");
const { assignResponder } = require("../services/assignmentService");
const { logIncidentHistory } = require("../repositories/incidentHistoryRepository");
const { generateSafetyRecommendation } = require("../services/safetyRecommendationService");
const { updateRiskZone } = require("../services/riskZoneService");
const { createNotification } = require("../repositories/notificationRepository");
const { sendPush } = require("../services/pushService");
const { getIO } = require("../socket");

// ===============================
// GET ALL ALERTS (ADMIN)
// ===============================
exports.getAlerts = async (req, res) => {
  console.log("📥 GET /alerts called");

  try {
    const result = await pool.query(
      "SELECT * FROM alerts ORDER BY id DESC"
    );

    console.log(`📊 Total alerts found: ${result.rows.length}`);

    res.json(result.rows);

  } catch (error) {
    console.error("❌ getAlerts error:", error);
    res.status(500).json({ error: error.message });
  }
};


// ===============================
// GET ALERT BY ID
// ===============================
exports.getAlertById = async (req, res) => {
  const { id } = req.params;

  console.log("📥 GET alert by ID:", id);

  try {
    const result = await pool.query(
      "SELECT * FROM alerts WHERE id = $1",
      [id]
    );

    console.log("📊 Result:", result.rows);

    res.json(result.rows[0]);

  } catch (error) {
    console.error("❌ getAlertById error:", error);
    res.status(500).json({ error: error.message });
  }
};


// ===============================
// CREATE ALERT
// ===============================
exports.createAlert = async (req, res) => {

  console.log("📥 CREATE ALERT REQUEST RECEIVED");
  console.log("📦 Body:", req.body);

  const {
    registrationNumber,
    incidentTypeId,
    incidentName,
    customIncident,
    description,
    latitude,
    longitude,
  } = req.body;

  try {

    // ----------------------------
    // STUDENT LOOKUP
    // ----------------------------
    console.log("🔎 Finding student:", registrationNumber);

    const studentResult = await pool.query(
      `SELECT id FROM students WHERE registration_number = $1`,
      [registrationNumber]
    );

    console.log("👤 Student result:", studentResult.rows);

    if (studentResult.rows.length === 0) {
      console.log("❌ Student not found");
      return res.status(404).json({ error: "Student not found" });
    }

    const studentId = studentResult.rows[0].id;
    console.log("✅ Student ID:", studentId);

    // ----------------------------
let incidentNameForSeverity = null;

// ✅ CASE 1: Predefined incident
if (incidentTypeId) {
  const incidentResult = await pool.query(
    `SELECT name FROM incident_types WHERE id = $1`,
    [incidentTypeId]
  );

  if (incidentResult.rows.length === 0) {
    return res.status(400).json({ error: "Invalid incident type" });
  }

  incidentNameForSeverity = incidentResult.rows[0].name;
  console.log("🎯 Incident Name from DB:", incidentNameForSeverity);
}

// ✅ CASE 2: Custom incident
else if (customIncident) {
  incidentNameForSeverity = customIncident.trim();
  console.log("🆕 Custom Incident:", incidentNameForSeverity);
}

// ❌ CASE 3: Nothing provided
else {
  return res.status(400).json({
    error: "Either incidentTypeId or customIncident is required",
  });
}

// ✅ Now calculate severity
const severityScore = getSeverityScore(incidentNameForSeverity);

console.log("⚠️ Severity Score:", severityScore);


// Safety check
if (severityScore == null) {
  return res.status(400).json({ error: "Invalid severity score generated" });
}

const severityResult = await pool.query(
  `SELECT id FROM severity_levels WHERE score = $1`,
  [severityScore]
);

if (severityResult.rows.length === 0) {
  return res.status(400).json({ error: "Severity level not found for score" });
}

const severityId = severityResult.rows[0].id;

console.log("🆔 Severity ID:", severityId);
// ----------------------------
    // INCIDENT TYPE
    // ----------------------------
    let incidentTypeIdFinal = incidentTypeId || null;

    if (incidentName) {
      console.log("🔎 Finding incident type:", incidentName);

      const result = await pool.query(
        `SELECT id FROM incident_types WHERE LOWER(name) = LOWER($1)`,
        [incidentName.trim()]
      );

      console.log("📊 Incident type result:", result.rows);

      if (result.rows.length > 0) {
        incidentTypeIdFinal = result.rows[0].id;
      }
    }

    console.log("🧾 Final incidentTypeId:", incidentTypeIdFinal);

    // ----------------------------
    // INSERT ALERT
    // ----------------------------
    const alertResult = await pool.query(
      `INSERT INTO alerts 
        (student_id, description, severity_id, incident_type_id, custom_incident)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        studentId,
        description,
        severityId,
        incidentTypeIdFinal,
        customIncident,
      ]
    );

    const alertId = alertResult.rows[0].id;

    console.log("🚨 Alert inserted ID:", alertId);


// 🔥 ADD THIS
//notifyAlertCreated(alertId, studentId);

    // ----------------------------
    // INSERT LOCATION
    // ----------------------------
    await pool.query(
      `INSERT INTO alert_locations (alert_id, latitude, longitude)
       VALUES ($1, $2, $3)`,
      [alertId, latitude, longitude]
    );
    

    console.log("📍 Location inserted for alert");

     // 🚨🔥 AI TRIGGER (THIS WAS MISSING)
    console.log("🤖 Triggering AI responder assignment...");

    assignResponder(alertId)
      .then((result) => {
        console.log("✅ AI Assignment completed:", result);
      })
      .catch((err) => {
        console.error("❌ AI Assignment failed:", err.message);
      });

      await createNotification({
  alertId,
  receiverType: "student",
  receiverId: studentId,
  message: "✅ Your emergency alert has been received. Help is on the way.",
});





// 🔥 GET STUDENT FCM TOKEN
const studentTokenResult = await pool.query(
  `SELECT fcm_token FROM students WHERE id = $1`,
  [studentId]
);

const studentToken = studentTokenResult.rows[0]?.fcm_token;

console.log("📲 Student FCM token:", studentToken);
if (studentToken) {
  await sendPush(
    studentToken,
    "🚨 Alert Received",
    "Your emergency alert has been received. Help is on the way.",
    getIO(),
    {
      userId: studentId,
      role: "student",
    }
  );

  console.log("📡 Student push sent");
} else {
  console.log("⚠️ No student FCM token found");
}

          // ============================
    // 🧠 INCIDENT HISTORY
    // ============================
    logIncidentHistory({
      alertId,
      latitude,
      longitude,
      incidentType: incidentNameForSeverity,
      severityLevel: severityScore,
    }).catch(err =>
      console.error("❌ Incident history error:", err.message)
    );

    // ============================
    // 🛡️ SAFETY RECOMMENDATION
    // ============================
    generateSafetyRecommendation(studentId, "medium")
      .then(() => console.log("🛡️ Safety recommendation generated"))
      .catch(err =>
        console.error("❌ Safety recommendation error:", err.message)
      );

      await updateRiskZone(
  latitude,
  longitude,
  severityScore
);
// ----------------------------
// FETCH FULL ALERT
// ----------------------------
const fullAlert = await pool.query(
  `
  SELECT 
    a.id,
    a.description,
    a.status,
    a.created_at,
    a.custom_incident,
    it.name AS incident_type,
    s.name AS severity_name,
    s.score AS severity_score,
    l.latitude,
    l.longitude
  FROM alerts a
  LEFT JOIN incident_types it ON a.incident_type_id = it.id
  LEFT JOIN severity_levels s ON a.severity_id = s.id
  LEFT JOIN alert_locations l ON l.alert_id = a.id
  WHERE a.id = $1
  `,
  [alertId]
);



// ----------------------------
// RETURN RESPONSE (VERY IMPORTANT)
// ----------------------------
return res.status(201).json(fullAlert.rows[0]);
    /*res.status(201).json({
      message: "✅ Alert created successfully",
      alertId,
      severityScore,
      severityId,
    }); */

  } catch (error) {
    console.error("❌ createAlert error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

function notifyAlertCreated(alertId, studentId) {
  const io = getIO();

  const room = `student_${studentId}`;

  console.log("📡 alert_created →", room);

  io.to(room).emit("alert_created", {
    alertId,
    status: "created",
  });
}


/// ===============================
// GET STUDENT SAFETY RECOMMENDATION
// ===============================
exports.getSafetyRecommendation = async (req, res) => {
  console.log("\n==============================");
  console.log("🔥 SAFETY ROUTE HIT");
  console.log("📌 Params:", req.params);
  console.log("==============================\n");

  const { studentId } = req.params;

  try {
    console.log("🔎 Step 1: Looking up student...");
    console.log("➡️ Student Registration Number:", studentId);

    // Find student
    const studentResult = await pool.query(
      `SELECT id, registration_number 
       FROM students 
       WHERE registration_number = $1`,
      [studentId]
    );

    console.log("👤 Student Query Result:", studentResult.rows);

    if (studentResult.rows.length === 0) {
      console.log("❌ Student NOT found in database");

      return res.status(404).json({
        error: "Student not found",
        data: []
      });
    }

    const dbStudentId = studentResult.rows[0].id;

    console.log("✅ Student found:");
    console.log("🆔 Student DB ID:", dbStudentId);

    console.log("\n🔎 Step 2: Fetching safety recommendation...");

    const result = await pool.query(
      `SELECT message, risk_level, created_at
       FROM safety_recommendations
       WHERE student_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [dbStudentId]
    );

    console.log("📊 Safety Recommendation Query Result:", result.rows);

    // ✅ IMPORTANT FIX: always return ARRAY for frontend consistency
    if (result.rows.length === 0) {
      console.log("⚠️ No safety recommendation found for this student");

      return res.json([]); // 👈 FIXED (no more object)
    }

    console.log("✅ Safety recommendation found:");
    console.log(result.rows[0]);

    // ✅ Always return array (even if single item)
    return res.json(result.rows);

  } catch (error) {
    console.error("\n❌ ERROR in getSafetyRecommendation:");
    console.error(error);

    return res.status(500).json({
      error: "Internal server error",
      data: []
    });
  }
};
// ===============================
// GET STUDENT ALERTS (FIXED + LOGS)
// ===============================
exports.getStudentAlerts = async (req, res) => {

  const { registrationNumber } = req.params;

  console.log("📥 GET STUDENT ALERTS");
  console.log("📌 registrationNumber:", registrationNumber);

  try {

    // CLEAN INPUT (VERY IMPORTANT)
    const regNo = registrationNumber.trim();

    console.log("🧹 Clean regNo:", regNo);

    // 1. GET STUDENT ID
    const studentResult = await pool.query(
      `SELECT id FROM students WHERE registration_number = $1`,
      [regNo]
    );

    console.log("👤 Student lookup:", studentResult.rows);

    if (studentResult.rows.length === 0) {
      console.log("❌ Student not found");
      return res.status(404).json({ error: "Student not found" });
    }

    const studentId = studentResult.rows[0].id;
    console.log("✅ Student ID:", studentId);

    // 2. GET ALERTS
    const result = await pool.query(
      `
      SELECT 
        a.id,
        a.description,
        a.status,
        a.created_at,
        a.custom_incident,

        it.name AS incident_type,
        s.name AS severity_name,
        s.score AS severity_score,

        al.latitude,
        al.longitude

      FROM alerts a
      LEFT JOIN incident_types it ON a.incident_type_id = it.id
      LEFT JOIN severity_levels s ON a.severity_id = s.id
      LEFT JOIN alert_locations al ON a.id = al.alert_id

      WHERE a.student_id = $1
      ORDER BY a.id DESC
      `,
      [studentId]
    );

   // console.log("📊 Alerts found:", result.rows.length);
   // console.log("📦 Alerts data:", result.rows);

    res.json(result.rows);

  } catch (error) {
    console.error("❌ getStudentAlerts error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


// ===============================
// UPDATE ALERT LOCATION
// ===============================
exports.updateAlertLocation = async (req, res) => {

  const { id } = req.params;
  const { latitude, longitude, registrationNumber } = req.body;

  console.log("📥 UPDATE LOCATION");
  console.log("ID:", id);
  console.log("Body:", req.body);

  try {

    // CHECK OWNERSHIP
    const check = await pool.query(
      `SELECT a.id 
       FROM alerts a
       JOIN students s ON a.student_id = s.id
       WHERE a.id = $1 AND s.registration_number = $2`,
      [id, registrationNumber]
    );

    console.log("🔐 Ownership check:", check.rows);

    if (check.rows.length === 0) {
      console.log("❌ Unauthorized update attempt");
      return res.status(403).json({ error: "Not authorized" });
    }

    // UPDATE
    const result = await pool.query(
      `
      UPDATE alert_locations
      SET latitude = $1, longitude = $2
      WHERE alert_id = $3
      RETURNING *
      `,
      [latitude, longitude, id]
    );

    console.log("📍 Updated location:", result.rows);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Location not found" });
    }

    res.json({
      message: "✅ Location updated successfully",
      location: result.rows[0]
    });

  } catch (error) {
    console.error("❌ updateAlertLocation error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};