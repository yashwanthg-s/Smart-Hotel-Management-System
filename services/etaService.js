require('dotenv').config();

/**
 * ETA Service using OpenRouteService API
 * POST https://api.openrouteservice.org/v2/directions/driving-car
 * Authorization header: API key directly (NO "Bearer" prefix)
 */

// Haversine fallback when ORS is unavailable
function haversineFallback(userLat, userLng, hotelLat, hotelLng) {
  const R = 6371;
  const dLat = (hotelLat - userLat) * Math.PI / 180;
  const dLon = (hotelLng - userLng) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(userLat * Math.PI / 180) *
    Math.cos(hotelLat * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  const distKm = parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2));
  const etaMin = Math.ceil((distKm / 30) * 60); // 30 km/h average
  return { eta: etaMin, distance: distKm, fallback: true };
}

async function calculateETA(userLat, userLng, hotelLat, hotelLng) {
  const apiKey = process.env.ORS_API_KEY;

  // Validate inputs
  const coords = [userLat, userLng, hotelLat, hotelLng].map(Number);
  if (coords.some(isNaN)) {
    throw new Error('Invalid coordinates');
  }

  // No API key — use fallback
  if (!apiKey || apiKey.trim() === '' || apiKey.trim() === 'your_openrouteservice_api_key_here') {
    console.warn('[ETA] No ORS API key set — using Haversine fallback');
    return haversineFallback(...coords);
  }

  const cleanKey = apiKey.trim();

  const payload = {
    coordinates: [
      [parseFloat(userLng), parseFloat(userLat)],   // [lng, lat] — ORS format
      [parseFloat(hotelLng), parseFloat(hotelLat)]
    ]
  };

  console.log('[ETA] Calling ORS API...');
  console.log('[ETA] Payload:', JSON.stringify(payload));
  console.log('[ETA] Key (first 30):', cleanKey.substring(0, 30) + '...');

  try {
    const response = await fetch('https://api.openrouteservice.org/v2/directions/driving-car', {
      method: 'POST',
      headers: {
        'Authorization': cleanKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json, application/geo+json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[ETA] ORS error ${response.status}:`, errText);
      console.warn('[ETA] Falling back to Haversine');
      return haversineFallback(...coords);
    }

    const data = await response.json();
    const summary = data.routes[0].summary;
    const etaMinutes = Math.ceil(summary.duration / 60);
    const distanceKm = parseFloat((summary.distance / 1000).toFixed(2));

    console.log(`[ETA] Success — ${distanceKm} km, ${etaMinutes} min`);
    return { eta: etaMinutes, distance: distanceKm, fallback: false };

  } catch (err) {
    console.error('[ETA] Fetch error:', err.message);
    return haversineFallback(...coords);
  }
}

module.exports = { calculateETA };
