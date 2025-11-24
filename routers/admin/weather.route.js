const express = require('express');
const router = express.Router();
const controller = require('../../controllers/admin/weather.controller');

// [GET] /admin/weather - Danh sách dữ liệu thời tiết
router.get('/', controller.index);

// [GET] /admin/weather/api/chart/:district - Lấy dữ liệu cho biểu đồ
router.get('/api/chart/:district', controller.getChartData);

// [GET] /admin/weather/detail/:district - Chi tiết thời tiết theo quận
router.get('/detail/:district', controller.detail);

// [GET] /admin/weather/export - Export dữ liệu thời tiết
router.get('/export', controller.export);

module.exports = router;
