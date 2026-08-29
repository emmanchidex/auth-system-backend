const pool = require("../config/db");

// =========================
// GET STUDENT NOTIFICATIONS
// =========================
exports.getNotifications = async (req, res) => {
  try {
    const { studentId } = req.params; 
    // ⚠️ this is actually the REGISTRATION NUMBER (e.g. 2022514)

    console.log("📥 [Student Notifications] regNo:", studentId);

    // STEP 1: Get internal student ID using registration number
    const studentQuery = await pool.query(
      `
      SELECT id
      FROM students
      WHERE registration_number = $1
      `,
      [studentId]
    );

    if (studentQuery.rows.length === 0) {
      return res.status(404).json({
        error: "Student not found for this registration number"
      });
    }

    const studentDBId = studentQuery.rows[0].id;

    console.log("✅ Internal student ID resolved:", studentDBId);

    // STEP 2: Use internal ID to fetch notifications
    const notifications = await pool.query(
      `
      SELECT *
      FROM notifications
      WHERE receiver_type = 'student'
      AND receiver_id = $1
      ORDER BY created_at DESC
      `,
      [studentDBId]
    );

    return res.json(notifications.rows);

  } catch (error) {
    console.error("❌ student notifications error:", error);
    return res.status(500).json({
      error: "Failed to fetch notifications"
    });
  }
};