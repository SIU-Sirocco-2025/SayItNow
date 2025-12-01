// © 2025 SIU_Sirocco – Phát hành theo GPL-3.0
// This file is part of Eco-Track.
// Eco-Track is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License.
// Eco-Track is distributed WITHOUT ANY WARRANTY; see LICENSE for details.
// See LICENSE in the project root for full license text.

const axios = require('axios');
const { toNGSILD } = require('../helpers/ngsiLdConverter');

const ORION_URL = process.env.FIWARE_BROKER_URL || 'http://localhost:1026';
const TENANT = process.env.FIWARE_TENANT || 'ecotrack';

/**
 * Tạo hoặc cập nhật entity trong Orion-LD
 */
async function upsertEntity(entity) {
  try {
    const headers = {
      'Content-Type': 'application/ld+json',
      'NGSILD-Tenant': TENANT
    };

    // Try to create
    try {
      await axios.post(
        `${ORION_URL}/ngsi-ld/v1/entities`,
        entity,
        { headers }
      );
      console.log(`[Orion-LD] Created entity: ${entity.id}`);
    } catch (createError) {
      // If exists, update instead
      if (createError.response?.status === 409) {
        await axios.patch(
          `${ORION_URL}/ngsi-ld/v1/entities/${encodeURIComponent(entity.id)}/attrs`,
          entity,
          { headers }
        );
        console.log(`[Orion-LD] Updated entity: ${entity.id}`);
      } else {
        throw createError;
      }
    }
  } catch (error) {
    console.error('[Orion-LD] Error:', error.message);
    throw error;
  }
}

/**
 * Đồng bộ AQI reading lên Orion-LD
 */
async function syncAQIReading(reading, districtKey) {
  const entity = toNGSILD(reading, districtKey);
  if (entity) {
    await upsertEntity(entity);
  }
}

module.exports = {
  upsertEntity,
  syncAQIReading
};