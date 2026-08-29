// utils/distance.js

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  console.log("📍 [calculateDistance] Input:", {
    from: { lat1, lon1 },
    to: { lat2, lon2 },
  });

  const toRad = (value) => (value * Math.PI) / 180;

  const R = 6371; // Earth radius in KM

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;

  console.log("📊 [calculateDistance] Result:", distance.toFixed(3), "km");

  return distance;
}

module.exports = { calculateDistance };