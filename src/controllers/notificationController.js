const pool = require("../config/db");

exports.getNotifications = async (req, res) => {
  const startTime = Date.now();
  const { receiverType, receiverId } = req.params;

  try {
    console.log("📥 [GET /notifications] Incoming request", {
      receiverType,
      receiverId,
      time: new Date().toISOString(),
      ip: req.ip,
    });

    console.log("🗄️ Executing DB query...", {
      query: "SELECT * FROM notifications WHERE receiver_type = $1 AND receiver_id = $2",
      values: [receiverType, receiverId],
    });

    const result = await pool.query(
      `
      SELECT * FROM notifications
      WHERE receiver_type = $1 AND receiver_id = $2
      ORDER BY created_at DESC
      `,
      [receiverType, receiverId]
    );

    console.log("📊 Query result", {
      count: result.rows.length,
      sample: result.rows[0] || null, // shows first row for debugging
      duration: `${Date.now() - startTime}ms`,
    });

    res.json(result.rows);

    console.log("📤 Response sent successfully", {
      receiverId,
      duration: `${Date.now() - startTime}ms`,
    });

  } catch (error) {
    console.error("❌ [GET /notifications] ERROR", {
      receiverType,
      receiverId,
      message: error.message,
      stack: error.stack,
      duration: `${Date.now() - startTime}ms`,
    });

    res.status(500).json({
      error: error.message,
    });
  }
};