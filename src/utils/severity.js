// utils/severity.js

function getSeverityScore(incidentName) {
  // Normalize input safely
  const name = incidentName?.toLowerCase().trim();

  // Debug log
  console.log("🧠 getSeverityScore received:", {
    raw: incidentName,
    normalized: name
  });

  switch (name) {
    case "shooting":
      return 5; // Critical 🔴

    case "fire":
      return 4; // High 🔥

    case "robbery":
      return 3; // High ⚠️

    case "accident":
      return 2; // Medium 🟡

    default:
      return 1; // Low 🟢
  }
}

module.exports = { getSeverityScore };