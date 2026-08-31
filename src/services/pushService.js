const admin = require("../config/firebase");

/**
 * sendPush
 * @param {string} token - FCM token
 * @param {string} title
 * @param {string} body
 * @param {object} io - socket.io instance
 * @param {object} userMeta - { userId, role }
 * @param {function} retryFn - function to retry sending push with NEW token
 */
async function sendPush(token, title, body, io = null, userMeta = null, retryFn = null) {
  console.log("==================================");
  console.log("📲 [sendPush] CALLED");
  console.log("🔑 Token:", token);
  console.log("🧾 Title:", title);
  console.log("📝 Body:", body);
  console.log("==================================");

  try {
    const message = {
      token,
      notification: { title, body },
    };

    const response = await admin.messaging().send(message);

    console.log("✅ Push sent successfully:", response);

    return {
      success: true,
      messageId: response,
    };

  } catch (err) {
    console.log("==================================");
    console.error("❌ PUSH FAILED:", err.message);
    console.log("==================================");

    // ===============================
    // 🚨 INVALID TOKEN HANDLING
    // ===============================
    const invalidTokenErrors = [
      "messaging/registration-token-not-registered",
      "messaging/invalid-registration-token",
      "messaging/sender-id-mismatch",
      "messaging/unregistered",
      "NotRegistered", // Added to catch raw Firebase messaging error strings
    ];

    const isInvalidToken =
      invalidTokenErrors.includes(err.code) ||
      invalidTokenErrors.some(code => err.message?.includes(code)) ||
      err.message?.includes("Requested entity was not found");

    if (isInvalidToken) {
      console.log("⚠️ Invalid FCM token detected");

      const userId = userMeta?.userId;
      const role = userMeta?.role;

      // 📡 STEP 1: notify client to refresh token
      if (io && userId) {
        io.to(`${role}_${userId}`).emit("FCM_TOKEN_REFRESH_REQUIRED", {
          type: "FCM_TOKEN_REFRESH_REQUIRED",
          userId,
          role,
          message: "refresh_token",
        });

        console.log("📡 Token refresh event sent to:", role, userId);
      }

      // ===============================
      // 🔁 STEP 2: RETRY AFTER DELAY
      // ===============================
      if (retryFn && userMeta) {
        console.log("⏳ Scheduling retry after token refresh...");

        setTimeout(async () => {
          try {
            console.log("🔄 Retrying push with new token...");

            await retryFn(userMeta);

            console.log("✅ Retry completed");
          } catch (retryErr) {
            console.error("❌ Retry failed:", retryErr.message);
          }
        }, 3000);
      }

      return {
        success: false,
        reason: "INVALID_FCM_TOKEN",
        action: "RETRY_SCHEDULED",
      };
    }

    throw err;
  }
}

module.exports = { sendPush };