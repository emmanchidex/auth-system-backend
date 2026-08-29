const express = require("express");
const cors = require("cors");
const http = require("http");

const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes");
const alertRoutes = require("./routes/alertRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const assignmentActionRoutes = require("./routes/assignmentActionRoutes");
const fcmRoutes = require("./routes/fcmRoutes");
const securityRoutes = require("./routes/securityRoutes");
const studentRoutes = require("./routes/studentRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");

const { initSocket } = require("./socket");

const app = express();

// =========================
// CREATE HTTP SERVER
// =========================
const server = http.createServer(app);

// =========================
// SOCKET INIT
// =========================
console.log("🔥 Creating HTTP server...");

try {
    initSocket(server);
    console.log("⚡ Socket initialized successfully");
} catch (err) {
    console.error("❌ Socket initialization failed:", err);
}

// =========================
// GLOBAL REQUEST LOGGER
// =========================
app.use((req, res, next) => {
    console.log("🔥 INCOMING REQUEST:", req.method, req.url);
    next();
});

console.log("🚀 STARTING APP...");

// =========================
// MIDDLEWARE
// =========================
app.use(cors());
app.use(express.json());

// =========================
// ROUTES
// =========================
app.use("/api/admin", adminRoutes);
app.use("/api", authRoutes);
app.use("/api", alertRoutes);
app.use("/assign", assignmentRoutes);
app.use("/api", fcmRoutes);
app.use("/api/security", securityRoutes);
app.use("/api/student", studentRoutes);
app.use("/api", recommendationRoutes);

// AI Assignment (dispatch)
app.use("/api/assignment", assignmentRoutes);

// Assignment actions
app.use("/api/assignment-action", assignmentActionRoutes);

// =========================
// START SERVER
// =========================
const PORT = 3000;

server.listen(PORT, "0.0.0.0", () => {
    console.log(`🌐 Server running on port ${PORT}`);
});