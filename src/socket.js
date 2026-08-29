const { Server } = require("socket.io");
const pool = require("./config/db");

let io;

// 🔥 in-memory tracking (upgrade to Redis later)
const activeTrackingAlerts = new Set();

// =========================
// RESTORE SINGLE ALERT
// =========================
function restoreTracking(alertId) {
  if (!alertId) return;

  activeTrackingAlerts.add(String(alertId));
  console.log("♻️ Restored tracking:", alertId);
}

// =========================
// RESTORE ALL ACTIVE ALERTS (ON SERVER START)
// =========================
async function restoreAllActiveTracking() {
  try {
    const result = await pool.query(
      "SELECT id FROM alerts WHERE status = 'active'"
    );

    result.rows.forEach(row => {
      activeTrackingAlerts.add(String(row.id));
    });

    console.log(
      "♻️ Restored ALL active tracking:",
      [...activeTrackingAlerts]
    );

  } catch (err) {
    console.error("❌ Failed to restore tracking", err);
  }
}

// =========================
// INIT SOCKET
// =========================
function initSocket(server) {
  io = new Server(server, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {

    console.log("🟢 Connected:", socket.id);

    socket.onAny((event, ...args) => {
      console.log(`📥 [${socket.id}] EVENT → ${event}`, args);
    });

    const originalEmit = socket.emit.bind(socket);
    socket.emit = (event, ...args) => {
      console.log(`📤 [${socket.id}] EMIT → ${event}`, args);
      return originalEmit(event, ...args);
    };

    // =========================
    // JOIN ROOM
    // =========================
    socket.on("join_alert_room", (alertId) => {
      if (!alertId) return;

      const room = `alert_${alertId}`;
      socket.join(room);

      console.log(`👥 ${socket.id} joined ${room}`);

      restoreTracking(alertId);
    });

    // =========================
// JOIN TOKEN ROOM (NEW)
// =========================
socket.on("join_token_room", (data) => {
  const userId = data?.userId;
  const role = data?.role || "user";

  if (!userId) return;

  const room = `${role}_${userId}`;
  socket.join(room);

  console.log(`🔐 ${socket.id} joined TOKEN ROOM ${room}`);
});

    // =========================
    // START TRACKING
    // =========================
    socket.on("start_tracking", (data) => {
      const alertId = String(data?.alertId);
      if (!alertId) return;

      activeTrackingAlerts.add(alertId);

      console.log("🚀 Tracking started:", alertId);
      console.log("📦 Active alerts:", [...activeTrackingAlerts]);
    });

    // =========================
    // STOP TRACKING
    // =========================
    socket.on("stop_tracking", (data) => {
      const alertId = String(data?.alertId);
      if (!alertId) return;

      activeTrackingAlerts.delete(alertId);

      console.log("🛑 Tracking stopped:", alertId);
      console.log("📦 Remaining alerts:", [...activeTrackingAlerts]);
    });

    // =========================
    // VICTIM LOCATION STREAM
    // =========================
    socket.on("send_location", (data) => {

      if (!data?.alertId) return;

      const alertId = String(data.alertId);
      const room = `alert_${alertId}`;

      if (!activeTrackingAlerts.has(alertId)) {
        console.log("♻️ Auto-restoring tracking:", alertId);
        activeTrackingAlerts.add(alertId);
      }

      io.to(room).emit("student_live_location", {
        alertId,
        latitude: data.latitude,
        longitude: data.longitude,
      });

      console.log(`📡 VICTIM → ${room} | ${data.latitude}, ${data.longitude}`);
    });

    // =========================
    // SECURITY LOCATION STREAM
    // =========================
    socket.on("send_security_location", (data) => {

      if (!data?.alertId) return;

      const alertId = String(data.alertId);
      const room = `alert_${alertId}`;

      io.to(room).emit("security_live_location", {
        alertId,
        latitude: data.latitude,
        longitude: data.longitude,
      });

      console.log(`🛡️ SECURITY → ${room} | ${data.latitude}, ${data.longitude}`);
    });

    // =========================
    // DISCONNECT
    // =========================
    socket.on("disconnect", (reason) => {
      console.log("🔴 Disconnected:", socket.id, "| Reason:", reason);
    });
  });

  setInterval(() => {
    console.log("💓 Server heartbeat");
    console.log("👥 Clients:", io.engine.clientsCount);
    console.log("📦 Active alerts:", [...activeTrackingAlerts]);
  }, 10000);
}

// =========================
// 🔥 TOKEN REFRESH EVENT (ROLE AWARE)
// =========================
function emitTokenRefreshRequired(userId, role = "user") {
  if (!io || !userId) return;

  io.to(`${role}_${userId}`).emit("FCM_TOKEN_REFRESH_REQUIRED", {
    type: "FCM_TOKEN_REFRESH_REQUIRED",
    userId,
    role,
    message: "refresh_token",
  });

  console.log("📡 Token refresh event sent to:", role, userId);
}

// =========================
// GET IO INSTANCE
// =========================
function getIO() {
  if (!io) throw new Error("Socket not initialized");
  return io;
}

module.exports = {
  initSocket,
  getIO,
  restoreAllActiveTracking,
  emitTokenRefreshRequired,
};