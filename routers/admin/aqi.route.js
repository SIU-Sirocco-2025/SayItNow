const express = require('express');
const router = express.Router();
const controller = require('../../controllers/admin/aqi.controller');

// [GET] /admin/aqi - Danh sách AQI
router.get('/', controller.index);

// [GET] /admin/aqi/api/chart/:district - Lấy dữ liệu cho biểu đồ
router.get('/api/chart/:district', controller.getChartData);

// [GET] /admin/aqi/detail/:district - Chi tiết AQI theo quận
router.get('/detail/:district', controller.detail);

// [GET] /admin/aqi/export - Export dữ liệu AQI
router.get('/export', controller.export);

module.exports = router;
