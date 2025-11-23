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

// API mới - Thống kê và phân tích
router.get('/compare', controller.compareDistricts);

router.get('/statistics/:cityKey', validateApiKey, controller.statistics);

router.get('/trend/:cityKey', validateApiKey, controller.trend);

router.get('/filter', validateApiKey, controller.filter);

router.get('/export/:cityKey', validateApiKey, controller.exportData);

router.get('/hourly-average/:cityKey', validateApiKey, controller.hourlyAverage);

module.exports = router;