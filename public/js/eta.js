// ETA Module - Smart Hotel Management
// Handles user location, ORS API calls, and smart prep time comparison

const ETAModule = (() => {
  let userLocation = null;
  let etaCache = {};  // Cache: key = "lat,lng" -> { eta, distance, timestamp }
  const CACHE_TTL = 3 * 60 * 1000; // 3 minutes cache

  // Get user's live location
  function getUserLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        pos => {
          userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          resolve(userLocation);
        },
        err => reject(new Error('Location access denied')),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });
  }

  // Fetch ETA from backend (keeps API key secure)
  async function fetchETA(hotelLat, hotelLng) {
    if (!userLocation) return null;

    const cacheKey = `${hotelLat},${hotelLng}`;
    const cached = etaCache[cacheKey];
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      return cached;
    }

    try {
      const res = await fetch(
        `/api/eta?userLat=${userLocation.lat}&userLng=${userLocation.lng}&hotelLat=${hotelLat}&hotelLng=${hotelLng}`
      );
      const data = await res.json();
      if (data.eta !== undefined) {
        etaCache[cacheKey] = { ...data, timestamp: Date.now() };
        return data;
      }
    } catch (e) {
      console.error('ETA fetch error:', e);
    }
    return null;
  }

  // Get smart message comparing ETA vs prep time
  function getSmartMessage(etaMinutes, prepTimeMinutes) {
    const diff = prepTimeMinutes - etaMinutes;
    if (diff <= 0) {
      return {
        text: '✅ Ready on arrival',
        color: '#68d391',
        icon: 'fas fa-check-circle',
        level: 'good'
      };
    } else if (diff <= 5) {
      return {
        text: `⚠️ ~${diff} min delay expected`,
        color: '#fbbf24',
        icon: 'fas fa-clock',
        level: 'warn'
      };
    } else {
      return {
        text: `🔴 ${diff} min delay expected`,
        color: '#fc8181',
        icon: 'fas fa-exclamation-triangle',
        level: 'bad'
      };
    }
  }

  // Render ETA badge HTML
  function renderETABadge(etaData, prepTime = null) {
    if (!etaData) return '';

    const distHtml = `<span style="color:#63b3ed;font-size:0.8rem;">
      <i class="fas fa-map-marker-alt me-1"></i>${etaData.distance} km
    </span>`;

    const timeHtml = `<span style="color:#a78bfa;font-size:0.8rem;margin-left:8px;">
      <i class="fas fa-car me-1"></i>${etaData.eta} min
    </span>`;

    let smartHtml = '';
    if (prepTime !== null) {
      const msg = getSmartMessage(etaData.eta, prepTime);
      smartHtml = `<div style="color:${msg.color};font-size:0.78rem;margin-top:4px;font-weight:600;">
        <i class="${msg.icon} me-1"></i>${msg.text}
      </div>`;
    }

    const fallbackNote = etaData.fallback
      ? `<span style="color:#64748b;font-size:0.7rem;"> (est.)</span>` : '';

    return `<div class="eta-badge mt-2">${distHtml}${timeHtml}${fallbackNote}${smartHtml}</div>`;
  }

  // Initialize: get location and update all hotel cards
  async function init() {
    try {
      await getUserLocation();
      return true;
    } catch (e) {
      console.warn('ETA:', e.message);
      return false;
    }
  }

  return { init, getUserLocation, fetchETA, getSmartMessage, renderETABadge, getUserLoc: () => userLocation };
})();

// Push ETA updates to server for active orders - called every 1 minute
ETAModule.trackOrderETA = async function(orderId, hotelLat, hotelLng) {
  try {
    // Get fresh location each time
    const loc = await ETAModule.getUserLocation().catch(() => ETAModule.getUserLoc());
    if (!loc) return;

    const etaData = await ETAModule.fetchETA(hotelLat, hotelLng);
    if (!etaData) return;

    const res = await fetch(`/api/orders/${orderId}/eta`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eta: etaData.eta, distance: etaData.distance })
    });

    const data = await res.json();
    console.log(`[ETA] Pushed to order ${orderId}: ${etaData.eta} min, ${etaData.distance} km`);

    // If staff should be alerted, show browser notification
    if (data.shouldAlert && Notification.permission === 'granted') {
      new Notification('🚨 Start Preparing!', {
        body: `Customer is ${etaData.eta} min away. Start preparing order now!`,
        icon: '/favicon.ico'
      });
    }

    return etaData;
  } catch (e) {
    console.error('[ETA] Push error:', e.message);
  }
};
