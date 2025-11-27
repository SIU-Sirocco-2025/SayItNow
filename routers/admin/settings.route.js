const express = require('express');
const router = express.Router();
const controller = require('../../controllers/admin/settings.controller');

// [GET] /admin/settings
router.get('/', controller.index);

// [POST] /admin/settings/change-password
router.post('/change-password', controller.changePassword);

module.exports = router;
