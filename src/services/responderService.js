const pool = require("../config/db");
const { sendPush } = require("./pushService");
const { getIO } = require("../socket");

// ===============================
// GET NEARBY RESPONDERS
// ===============================
async function getNearbyResponders(lat, lng) {
  console.log("\n==============================");
  console.log("📍 [getNearbyResponders] START");
  console.log("INPUT:", { lat, lng });

  const query = `
    SELECT 
        s.id,
        s.security_number,
        s.status,
        s.fcm_token,
        b.latitude,
        b.longitude,
        (6371 * acos(
            cos(radians($1)) * cos(radians(b.latitude)) *
            cos(radians(b.longitude) - radians($2)) +
            sin(radians($1)) * sin(radians(b.latitude))
        )) AS distance
    FROM security s
    JOIN branches b ON s.branch_id = b.id
    WHERE s.status = 'available'
    ORDER BY distance ASC
    LIMIT 10;
  `;

  try {
    console.log("📡 Executing nearby responder query...");

    const result = await pool.query(query, [lat, lng]);

    console.log("📊 RAW DB RESULT COUNT:", result.rows.length);
    console.log("📦 RESPONDERS FULL DATA:");
    console.dir(result.rows, { depth: null });

    result.rows.forEach((r, i) => {
      console.log(`\n🔹 Responder ${i + 1}:`);
      console.log("ID:", r.id);
      console.log("Security Number:", r.security_number);
      console.log("Status:", r.status);
      console.log("FCM Token Exists:", !!r.fcm_token);
      console.log("Distance:", r.distance);
    });

    console.log("✅ [getNearbyResponders] END\n");

    return result.rows;

  } catch (error) {
    console.error("❌ [getNearbyResponders] ERROR:");
    console.error(error);
    throw error;
  }
}

// ===============================
// GET WORKLOAD
// ===============================
async function getWorkload(securityId) {
  console.log("\n==============================");
  console.log("📦 [getWorkload] START");
  console.log("Security ID:", securityId);

  const query = `
    SELECT COUNT(*) 
    FROM alert_assignments 
    WHERE security_id = $1 
    AND status IN ('assigned', 'accepted');
  `;

  try {
    const result = await pool.query(query, [securityId]);

    console.log("📊 RAW WORKLOAD RESULT:", result.rows);

    const workload = parseInt(result.rows[0].count, 10);

    console.log("📦 FINAL WORKLOAD:", {
      securityId,
      workload
    });

    console.log("📦 [getWorkload] END\n");

    return workload;

  } catch (error) {
    console.error("❌ [getWorkload] ERROR:");
    console.error(error);
    throw error;
  }
}

// ===============================
// ASSIGN + SEND NOTIFICATION
// ===============================
async function assignAndNotify(primary, alertId = null) {
  console.log("\n==============================");
  console.log("🚨 [assignAndNotify] START");
  console.log("PRIMARY OBJECT:");
  console.dir(primary, { depth: null });
  console.log("ALERT ID:", alertId);

  try {
    if (!primary) {
      console.log("❌ PRIMARY IS NULL/UNDEFINED");
      return;
    }

    console.log("\n🔎 FIELD CHECK:");
    console.log("primary.id:", primary.id);
    console.log("primary.security_number:", primary.security_number);
    console.log("primary.fcm_token:", primary.fcm_token);

    const token = primary.fcm_token;

    if (!token) {
      console.log("⚠️ NO FCM TOKEN FOUND → STOPPING PUSH");
      return;
    }

    console.log("📲 VALID FCM TOKEN FOUND:", token);

    const socketUserId = primary.security_number || primary.id;

    console.log("🧠 SOCKET USER ID RESOLVED:", socketUserId);

    const io = getIO();

    console.log("🧠 SOCKET IO INSTANCE:", !!io);

    console.log("📤 CALLING sendPush...");

    const payload = {
      userId: socketUserId,
      role: "security",
      alertId: alertId,
    };

    console.log("📦 PUSH PAYLOAD:", payload);

    await sendPush(
      token,
      "🚨 Emergency Alert",
      "You have been assigned to a new emergency",
      io,
      payload
    );

    console.log("✅ PUSH SENT SUCCESSFULLY");

    console.log(`📡 EMITTED TO: security_${socketUserId}`);

    console.log("🚨 [assignAndNotify] END\n");

  } catch (error) {
    console.error("❌ [assignAndNotify] ERROR:");
    console.error("MESSAGE:", error.message);
    console.error("STACK:", error.stack);
  }
}

module.exports = {
  getNearbyResponders,
  getWorkload,
  assignAndNotify
};