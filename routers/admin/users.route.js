const express = require('express');
const router = express.Router();
const controller = require('../../controllers/admin/users.controller');

// Views
router.get('/', controller.index);
router.post('/', controller.create);
router.delete('/:id', controller.remove);

module.exports = router;
