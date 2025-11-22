const express = require('express');
const router = express.Router();
const controller = require('../../controllers/client/aqi.controller');
const { validateApiKey } = require('../../middlewares/auth.middleware');

router.get('/', controller.page);

router.get('/data', controller.latestPoints);

router.get('/history/:cityKey', validateApiKey, controller.history);

router.get('/hour-latest', controller.latestCityHour);

router.get('/latest-reading', controller.latestCityReading);

router.get('/by-datetime/:cityKey', validateApiKey, controller.byDateTime);

module.exports = router;