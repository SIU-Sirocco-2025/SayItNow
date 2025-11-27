const express = require('express');
const router = express.Router();
const controller = require('../../controllers/client/ticket.controller');

router.post('/submit', controller.submit);

module.exports = router;