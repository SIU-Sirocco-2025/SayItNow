// © 2025 SIU_Sirocco – Phát hành theo GPL-3.0
// This file is part of Eco-Track.
// ...existing license header...

const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function testNGSILD() {
  console.log('🧪 Testing NGSI-LD API endpoints...\n');

  try {
    // Test 1: Get context
    console.log('1️⃣ Testing /api/ngsi-ld/context');
    const contextRes = await axios.get(`${BASE_URL}/api/ngsi-ld/context`);
    console.log('✅ Context retrieved');
    console.log('   @context keys:', Object.keys(contextRes.data['@context']).slice(0, 5).join(', ') + '...\n');

    // Test 2: Get single entity
    console.log('2️⃣ Testing /api/ngsi-ld/entities/district1');
    const entityRes = await axios.get(`${BASE_URL}/api/ngsi-ld/entities/district1`, {
      headers: { 'Accept': 'application/ld+json' }
    });
    console.log('✅ Entity retrieved');
    console.log('   ID:', entityRes.data.id);
    console.log('   Type:', entityRes.data.type);
    console.log('   AQI US:', entityRes.data.aqius?.value, '\n');

    // Test 3: Query all entities
    console.log('3️⃣ Testing /api/ngsi-ld/entities (all districts)');
    const allEntitiesRes = await axios.get(`${BASE_URL}/api/ngsi-ld/entities?limit=5`);
    console.log('✅ Retrieved', allEntitiesRes.data.length, 'entities\n');

    // Test 4: Temporal query
    console.log('4️⃣ Testing /api/ngsi-ld/entities/district1/temporal');
    const temporalRes = await axios.get(`${BASE_URL}/api/ngsi-ld/entities/district1/temporal?limit=10`);
    console.log('✅ Retrieved', temporalRes.data.length, 'temporal entities\n');

    console.log('✨ All tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    process.exit(1);
  }
}

testNGSILD();