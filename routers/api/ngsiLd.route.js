// © 2025 SIU_Sirocco – Phát hành theo GPL-3.0
// This file is part of Eco-Track.
// Eco-Track is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License.
// Eco-Track is distributed WITHOUT ANY WARRANTY; see LICENSE for details.
// See LICENSE in the project root for full license text.

const express = require('express');
const router = express.Router();
const aqiController = require('../../controllers/api/aqiNgsiLd.controller');
const predictionController = require('../../controllers/api/prediction.controller');

// Context endpoint
router.get('/context', aqiController.getContext);

// Query entities
router.get('/entities', aqiController.queryEntities);

// Get single entity (latest reading)
router.get('/entities/:district', aqiController.getEntity);

// Temporal query
router.get('/entities/:district/temporal', aqiController.getTemporalEntity);

// Predictions in NGSI-LD format
router.post('/predictions/:district', predictionController.forecast24hNGSILD);

module.exports = router;