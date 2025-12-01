// © 2025 SIU_Sirocco – Phát hành theo GPL-3.0
// This file is part of Eco-Track.
// Eco-Track is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License.
// Eco-Track is distributed WITHOUT ANY WARRANTY; see LICENSE for details.
// See LICENSE in the project root for full license text.

const models = require('../../models');
const { toNGSILD, toNGSILDArray } = require('../../helpers/ngsiLdConverter');

const DISTRICT_MODEL_MAP = {
  'hcmc': models.HCMCReading,
  'district1': models.District1Reading,
  'district2': models.District2Reading,
  'district3': models.District3Reading,
  'district4': models.District4Reading,
  'district5': models.District5Reading,
  'district6': models.District6Reading,
  'district7': models.District7Reading,
  'district9': models.District9Reading,
  'district10': models.District10Reading,
  'district11': models.District11Reading,
  'binhThanh': models.BinhThanhReading,
  'phuNhuan': models.PhuNhuanReading,
  'tanPhu': models.TanPhuReading,
  'thuDuc': models.ThuDucReading,
  'binhTan': models.BinhTanReading
};

// [GET] /api/ngsi-ld/entities/:district
module.exports.getEntity = async (req, res) => {
  try {
    const { district } = req.params;
    
    if (!DISTRICT_MODEL_MAP[district]) {
      return res.status(404).json({
        "type": "https://uri.etsi.org/ngsi-ld/errors/ResourceNotFound",
        "title": "District not found",
        "detail": `District '${district}' is not valid`
      });
    }

    const Model = DISTRICT_MODEL_MAP[district];
    const latest = await Model.findOne()
      .sort({ 'current.pollution.ts': -1 })
      .lean();

    if (!latest) {
      return res.status(404).json({
        "type": "https://uri.etsi.org/ngsi-ld/errors/ResourceNotFound",
        "title": "No data found"
      });
    }

    const entity = toNGSILD(latest, district);
    
    res.setHeader('Content-Type', 'application/ld+json');
    res.json(entity);
    
  } catch (error) {
    console.error('[NGSI-LD] Error:', error);
    res.status(500).json({
      "type": "https://uri.etsi.org/ngsi-ld/errors/InternalError",
      "title": "Internal Server Error"
    });
  }
};

// [GET] /api/ngsi-ld/entities/:district/temporal
module.exports.getTemporalEntity = async (req, res) => {
  try {
    const { district } = req.params;
    const { timeAt, endTimeAt, limit = 24 } = req.query;
    
    if (!DISTRICT_MODEL_MAP[district]) {
      return res.status(404).json({
        "type": "https://uri.etsi.org/ngsi-ld/errors/ResourceNotFound",
        "title": "District not found"
      });
    }

    const Model = DISTRICT_MODEL_MAP[district];
    const query = {};
    
    if (timeAt || endTimeAt) {
      query['current.pollution.ts'] = {};
      if (timeAt) query['current.pollution.ts'].$gte = new Date(timeAt);
      if (endTimeAt) query['current.pollution.ts'].$lte = new Date(endTimeAt);
    }

    const readings = await Model.find(query)
      .sort({ 'current.pollution.ts': -1 })
      .limit(parseInt(limit))
      .lean();

    const entities = toNGSILDArray(readings, district);
    
    res.setHeader('Content-Type', 'application/ld+json');
    res.json(entities);
    
  } catch (error) {
    console.error('[NGSI-LD] Error:', error);
    res.status(500).json({
      "type": "https://uri.etsi.org/ngsi-ld/errors/InternalError",
      "title": "Internal Server Error"
    });
  }
};

// [GET] /api/ngsi-ld/entities (query all districts)
module.exports.queryEntities = async (req, res) => {
  try {
    const { type = 'AQIReading', limit = 10 } = req.query;
    
    const allEntities = [];
    
    for (const [districtKey, Model] of Object.entries(DISTRICT_MODEL_MAP)) {
      const latest = await Model.findOne()
        .sort({ 'current.pollution.ts': -1 })
        .lean();
      
      if (latest) {
        const entity = toNGSILD(latest, districtKey);
        allEntities.push(entity);
      }
    }

    res.setHeader('Content-Type', 'application/ld+json');
    res.json(allEntities.slice(0, parseInt(limit)));
    
  } catch (error) {
    console.error('[NGSI-LD] Error:', error);
    res.status(500).json({
      "type": "https://uri.etsi.org/ngsi-ld/errors/InternalError",
      "title": "Internal Server Error"
    });
  }
};

module.exports.getContext = (req, res) => {
  res.setHeader('Content-Type', 'application/ld+json');
  res.json(require('../../config/ngsi-ld-context'));
};