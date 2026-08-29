const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// =========================
// SAVE / UPDATE FCM TOKEN
// =========================
router.post("/save-token", async (req, res) => {
  const { role, identifier, fcmToken } = req.body;

  console.log("📲 [FCM] Save token request:", {
    role,
    identifier,
    fcmToken,
  });

  if (!role || !identifier || !fcmToken) {
    return res.status(400).json({
      error: "role, identifier and fcmToken are required",
    });
  }

  try {
    let result;

    // =========================
    // STUDENT
    // =========================
    if (role === "student") {
      result = await pool.query(
        `UPDATE students
         SET fcm_token = $1
         WHERE registration_number = $2
         RETURNING id`,
        [fcmToken, identifier]
      );
    }

    // =========================
    // SECURITY
    // =========================
    else if (role === "security") {
      result = await pool.query(
        `UPDATE security
         SET fcm_token = $1
         WHERE security_number = $2
         RETURNING id`,
        [fcmToken, identifier]
      );
    }

    // =========================
    // INVALID ROLE
    // =========================
    else {
      return res.status(400).json({
        error: "Invalid role"
      });
    }

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    console.log("✅ [FCM] Token saved successfully");

    res.json({
      message: "FCM token saved successfully",
    });

  } catch (err) {
    console.error("❌ [FCM] Error saving token:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;