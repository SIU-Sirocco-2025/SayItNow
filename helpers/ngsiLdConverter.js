// © 2025 SIU_Sirocco – Phát hành theo GPL-3.0
// This file is part of Eco-Track.
// Eco-Track is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License.
// Eco-Track is distributed WITHOUT ANY WARRANTY; see LICENSE for details.
// See LICENSE in the project root for full license text.

const NGSI_LD_CONTEXT = require('../config/ngsi-ld-context');

/**
 * Chuyển đổi AQI reading từ MongoDB model sang NGSI-LD entity
 */
function toNGSILD(reading, districtKey) {
  if (!reading || !reading.current) {
    return null;
  }

  const { pollution, weather } = reading.current;
  const timestamp = pollution.ts || new Date().toISOString();
  
  // Tạo unique ID theo chuẩn URN NGSI-LD
  const entityId = `urn:ngsi-ld:AQIReading:${districtKey}:${new Date(timestamp).getTime()}`;

  return {
    "@context": "https://ecotrack.asia/context/v1",
    "id": entityId,
    "type": "AQIReading",
    
    // AQI properties
    "aqius": {
      "type": "Property",
      "value": pollution.aqius || 0,
      "observedAt": timestamp
    },
    "aqicn": {
      "type": "Property",
      "value": pollution.aqicn || 0,
      "observedAt": timestamp
    },
    "mainus": {
      "type": "Property",
      "value": pollution.mainus || "unknown",
      "observedAt": timestamp
    },
    "maincn": {
      "type": "Property",
      "value": pollution.maincn || "unknown",
      "observedAt": timestamp
    },
    
    // Weather properties
    "temperature": {
      "type": "Property",
      "value": weather?.tp || 0,
      "unitCode": "CEL",
      "observedAt": timestamp
    },
    "humidity": {
      "type": "Property",
      "value": weather?.hu || 0,
      "unitCode": "P1",
      "observedAt": timestamp
    },
    "pressure": {
      "type": "Property",
      "value": weather?.pr || 0,
      "unitCode": "A97",
      "observedAt": timestamp
    },
    "windSpeed": {
      "type": "Property",
      "value": weather?.ws || 0,
      "unitCode": "MTS",
      "observedAt": timestamp
    },
    
    // Location (GeoProperty)
    "location": {
      "type": "GeoProperty",
      "value": {
        "type": "Point",
        "coordinates": reading.location?.coordinates || [0, 0]
      }
    },
    
    // District info
    "city": {
      "type": "Property",
      "value": reading.city || "Unknown"
    },
    "state": {
      "type": "Property",
      "value": reading.state || "Unknown"
    },
    "country": {
      "type": "Property",
      "value": reading.country || "Vietnam"
    },
    
    // Timestamps
    "dateCreated": {
      "type": "Property",
      "value": timestamp
    },
    "dateModified": {
      "type": "Property",
      "value": timestamp
    }
  };
}

/**
 * Chuyển đổi mảng readings sang NGSI-LD
 */
function toNGSILDArray(readings, districtKey) {
  return readings
    .map(r => toNGSILD(r, districtKey))
    .filter(r => r !== null);
}

/**
 * Chuyển đổi prediction data sang NGSI-LD
 */
function predictionToNGSILD(prediction, districtKey) {
  const entityId = `urn:ngsi-ld:AQIPrediction:${districtKey}:${prediction.hour}`;
  
  return {
    "@context": "https://ecotrack.asia/context/v1",
    "id": entityId,
    "type": "AQIPrediction",
    
    "predictedAQI": {
      "type": "Property",
      "value": Math.round(prediction.aqi),
      "observedAt": new Date().toISOString()
    },
    "predictionHour": {
      "type": "Property",
      "value": prediction.hour
    },
    "quality": {
      "type": "Property",
      "value": prediction.quality
    },
    "timestamp": {
      "type": "Property",
      "value": prediction.timestamp
    },
    "district": {
      "type": "Relationship",
      "object": `urn:ngsi-ld:District:${districtKey}`
    }
  };
}

module.exports = {
  toNGSILD,
  toNGSILDArray,
  predictionToNGSILD,
  NGSI_LD_CONTEXT
};