const { getAlertDetails } = require("../repositories/alertRepository");
const {
  createAssignment,
  logPriority,
} = require("../repositories/assignmentRepository");

const {
  getNearbyResponders,
  getWorkload,
} = require("./responderService");

const { calculateScore } = require("./scoringService");
const { createNotification } = require("../repositories/notificationRepository");
const { assignAndNotify } = require("./responderService");
const pool = require("../config/db");


async function assignResponder(alertId) {
  console.log("🚨 [assignResponder] START:", { alertId });

  const alert = await getAlertDetails(alertId);

  if (!alert) {
    console.error("❌ [assignResponder] Alert not found:", alertId);
    throw new Error("Alert not found");
  }

  console.log("📍 [assignResponder] Alert loaded:", {
    id: alert.id,
    severity: alert.severity,
    lat: alert.latitude,
    lng: alert.longitude,
  });

  const responders = await getNearbyResponders(
    alert.latitude,
    alert.longitude
  );

  console.log("👮 [assignResponder] Responders found:", responders.length);

  if (responders.length === 0) {
    console.warn("⚠️ [assignResponder] No responders available");
    throw new Error("No responders available");
  }

  // ⚡ STEP 1: SCORING
  const scoredResponders = await Promise.all(
    responders.map(async (r) => {
      console.log("🔄 Scoring responder:", r.id);

      const workload = await getWorkload(r.id);

      const score = calculateScore({
        distance: r.distance,
        severity: alert.severity,
        availability: 1,
        workload,
      });

      console.log("📊 [Responder Score]", {
        id: r.id,
        distance: r.distance,
        workload,
        score,
      });

      await logPriority(alertId, score, alert.severity, r.distance);

      return { ...r, score };
    })
  );

  // ⚡ STEP 2: SORT
  scoredResponders.sort((a, b) => b.score - a.score);

  console.log("🏁 [assignResponder] Ranking complete:", {
    top: scoredResponders[0]?.id,
    topScore: scoredResponders[0]?.score,
  });

  const topResponders = scoredResponders.slice(0, 3);

  console.log(
    "🥇 Top 3 responders:",
    topResponders.map((r) => ({
      id: r.id,
      score: r.score,
    }))
  );




  // 🥇 PRIMARY CANDIDATE (after ranking)
const primary = topResponders[0];

let assigned = false;

// =========================
// TRY PRIMARY FIRST
// =========================
if (primary?.fcm_token) {
  await createAssignment(alertId, primary.id);

  await pool.query(
    `UPDATE alerts SET status = 'assigned' WHERE id = $1`,
    [alertId]
  );

  console.log("✅ Primary assigned:", primary.id);

  await assignAndNotify(primary);

  await createNotification({
    alertId,
    receiverType: "security",
    receiverId: primary.id,
    message: "🚨 You have been assigned to a new emergency alert",
  });

  assigned = true;
}

// =========================
// IF PRIMARY FAILS → TRY BACKUPS
// =========================
if (!assigned) {
  for (const backup of topResponders.slice(1)) {
    if (!backup?.fcm_token) continue;

    await createAssignment(alertId, backup.id);

    await pool.query(
      `UPDATE alerts SET status = 'assigned' WHERE id = $1`,
      [alertId]
    );

    console.log("🟡 Backup assigned:", backup.id);

    await assignAndNotify(backup);

    await createNotification({
      alertId,
      receiverType: "security",
      receiverId: backup.id,
      message: "🚨 You have been assigned to a nearby emergency alert (fallback)",
    });

    assigned = true;
    break;
  }
}

// =========================
// IF NO ONE HAS TOKEN
// =========================
if (!assigned) {
  console.warn("⚠️ No responder with valid FCM token. No assignment done.");
}

// =========================
// ALWAYS RETURN RANKING (IMPORTANT)
// =========================
return {
  primary: primary?.id,
  backups: topResponders.slice(1).map((r) => r.id),
  assigned, // 👈 tells frontend if assignment happened
  scores: topResponders.map((r) => ({
    id: r.id,
    score: r.score,
  })),
};
}

module.exports = { assignResponder };