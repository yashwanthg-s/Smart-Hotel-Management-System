require('dotenv').config();
const { calculateETA } = require('./services/etaService');

async function test() {
  console.log('=== ETA Service Test ===');
  const key = process.env.ORS_API_KEY;
  console.log('API Key loaded:', key ? '✅ Yes' : '❌ No');
  console.log('API Key length:', key ? key.trim().length : 0);
  console.log('API Key (first 30):', key ? key.trim().substring(0, 30) + '...' : 'MISSING');
  console.log('');

  try {
    const result = await calculateETA(12.9352, 77.6245, 12.9716, 77.5946);
    console.log('✅ Result:', result);
    console.log(`Source: ${result.fallback ? '⚠️ Haversine fallback' : '✅ OpenRouteService API'}`);
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

test();
