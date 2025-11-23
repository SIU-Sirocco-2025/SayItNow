const express = require('express');
const router = express.Router();
const controller = require('../../controllers/client/docs.controller');

router.get('/', controller.index);

module.exports = router;
