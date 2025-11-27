const express = require('express');
const router = express.Router();
const controller = require('../../controllers/admin/user.controller');

// Views
router.get('/', controller.index);

// APIs
router.get('/api/list', controller.getList);
router.post('/api/create', controller.create);
router.patch('/api/reset-password/:id', controller.resetPassword);
router.delete('/api/delete/:id', controller.remove);

module.exports = router;
