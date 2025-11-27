const express = require('express');
const router = express.Router();
const controller = require('../../controllers/admin/ticket.controller');

// Views
router.get('/', controller.index);
router.get('/api/stats', controller.stats);
router.get('/:id', controller.detail);

// Actions
router.patch('/:id/status', controller.updateStatus);
router.patch('/:id/priority', controller.updatePriority);
router.patch('/:id/note', controller.updateNote);
router.delete('/:id', controller.delete);

module.exports = router;