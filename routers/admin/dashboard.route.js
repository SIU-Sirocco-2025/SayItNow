const express = require('express'); 
const router = express.Router(); 
const controller = require('../../controllers/admin/dashboard.controller'); 

// Views
router.get('/', controller.index); 

// APIs
router.get('/api/aqi-chart', controller.getAQIChartData);
router.get('/api/temp-chart', controller.getTempChartData);
router.get('/api/alerts', controller.getAlertData);
router.get('/api/ranking', controller.getRankingData);

module.exports = router;
