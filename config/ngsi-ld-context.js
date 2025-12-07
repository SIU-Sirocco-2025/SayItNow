// © 2025 SIU_Sirocco – Phát hành theo GPL-3.0
// This file is part of Eco-Track.
// Eco-Track is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License.
// Eco-Track is distributed WITHOUT ANY WARRANTY; see LICENSE for details.
// See LICENSE in the project root for full license text.

/**
 * NGSI-LD @context cho Eco-Track
 * Định nghĩa namespace và thuộc tính cho AQI entities
 */
const NGSI_LD_CONTEXT = {
  "@context": {
    "type": "@type",
    "id": "@id",
    "ngsi-ld": "https://uri.etsi.org/ngsi-ld/",
    "ecotrack": "https://ecotrack.asia/entities/",
    "schema": "https://schema.org/",
    "geo": "http://www.w3.org/2003/01/geo/wgs84_pos#",

    // SOSA/SSN namespaces
    "sosa": "http://www.w3.org/ns/sosa/",
    "ssn": "http://www.w3.org/ns/ssn/",
    "Observation": "sosa:Observation",
    "ObservedProperty": "sosa:ObservedProperty",
    "Sensor": "sosa:Sensor",
    "hasFeatureOfInterest": "sosa:hasFeatureOfInterest",
    "observedProperty": "sosa:observedProperty",
    "madeBySensor": "sosa:madeBySensor",

    // FIWARE AirQualityObserved type
    "AirQualityObserved": "https://schema.fiware.org/Weather/AirQualityObserved",

    // Core props (FIWARE)
    "dateObserved": { "@id": "schema:Date", "@type": "ngsi-ld:Property" },
    "airQualityIndex": { "@id": "ecotrack:airQualityIndex", "@type": "ngsi-ld:Property" },

    // Pollutants & Measurements (chỉ có sẵn từ OpenAQ)
    "pm1":   { "@id": "ecotrack:pm1",   "@type": "ngsi-ld:Property" },
    "pm25":  { "@id": "ecotrack:pm25",  "@type": "ngsi-ld:Property" },
    "um003": { "@id": "ecotrack:um003", "@type": "ngsi-ld:Property" },
    
    // Weather data
    "temperature":       { "@id": "ecotrack:temperature",       "@type": "ngsi-ld:Property" },
    "relativehumidity":  { "@id": "ecotrack:relativehumidity",  "@type": "ngsi-ld:Property" },
    "pressure":          { "@id": "ecotrack:pressure",          "@type": "ngsi-ld:Property" },
    "windSpeed":         { "@id": "ecotrack:windSpeed",         "@type": "ngsi-ld:Property" },
    "windDirection":     { "@id": "ecotrack:windDirection",     "@type": "ngsi-ld:Property" },

    // Location
    "location": { "@id": "ngsi-ld:location", "@type": "ngsi-ld:GeoProperty" },
    "city":     { "@id": "schema:addressLocality", "@type": "ngsi-ld:Property" },
    "state":    { "@id": "schema:addressRegion",   "@type": "ngsi-ld:Property" },
    "country":  { "@id": "schema:addressCountry",  "@type": "ngsi-ld:Property" },

    // Legacy AQIReading (giữ để tương thích cũ)
    "AQIReading": "ecotrack:AQIReading",
    "aqius": { "@id": "ecotrack:aqius", "@type": "ngsi-ld:Property" },
    "aqicn": { "@id": "ecotrack:aqicn", "@type": "ngsi-ld:Property" },
    "mainus": { "@id": "ecotrack:mainus", "@type": "ngsi-ld:Property" },
    "maincn": { "@id": "ecotrack:maincn", "@type": "ngsi-ld:Property" },
    "timestamp": { "@id": "schema:dateModified", "@type": "ngsi-ld:Property" },

    // Weather (giữ)
    "temperature": { "@id": "ecotrack:temperature", "@type": "ngsi-ld:Property" },
    "humidity":    { "@id": "ecotrack:humidity",    "@type": "ngsi-ld:Property" },
    "pressure":    { "@id": "ecotrack:pressure",    "@type": "ngsi-ld:Property" },
    "windSpeed":   { "@id": "ecotrack:windSpeed",   "@type": "ngsi-ld:Property" }
  }
};

module.exports = NGSI_LD_CONTEXT;