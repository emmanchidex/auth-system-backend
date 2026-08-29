// services/scoringService.js

function calculateScore({ distance, severity, availability, workload }) {
  console.log("🧠 [calculateScore] Inputs:", {
    distance,
    severity,
    availability,
    workload,
  });

  const distanceScore = 0.5 * (1 / (distance + 0.001));
  const severityScore = 0.3 * severity;
  const availabilityScore = 0.2 * availability;
  const workloadPenalty = 0.1 * workload;

  const totalScore =
    distanceScore + severityScore + availabilityScore - workloadPenalty;

  console.log("📊 [calculateScore] Breakdown:", {
    distanceScore,
    severityScore,
    availabilityScore,
    workloadPenalty,
    totalScore,
  });

  return totalScore;
}

module.exports = { calculateScore };