// © 2025 SIU_Sirocco – Phát hành theo GPL-3.0
// This file is part of Eco-Track.
// Eco-Track is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License.
// Eco-Track is distributed WITHOUT ANY WARRANTY; see LICENSE for details.
// See LICENSE in the project root for full license text.
const express = require('express');
const router = express.Router();
const controller = require('../../controllers/admin/ticket.controller');

// API routes (must be before :id routes)
router.get('/api/stats', controller.stats);

// Views
router.get('/', controller.index);
router.get('/:id', controller.detail);

// Actions
router.patch('/:id/status', controller.updateStatus);
router.patch('/:id/priority', controller.updatePriority);
router.patch('/:id/note', controller.updateNote);
router.delete('/:id', controller.delete);

module.exports = router;