const {
  District1Reading,
  District2Reading,
  District3Reading,
  District4Reading,
  District5Reading,
  District6Reading,
  District7Reading,
  District9Reading,
  District10Reading,
  District11Reading,
  BinhThanhReading,
  PhuNhuanReading,
  TanPhuReading,
  ThuDucReading,
  BinhTanReading,
  HCMCReading
} = require('../../models');

const { json2csv } = require('json2csv');
const fs = require('fs-extra');
const path = require('path');

// Map tên quận đến model
const DISTRICT_MODELS = {
  'district-1': District1Reading,
  'district-2': District2Reading,
  'district-3': District3Reading,
  'district-4': District4Reading,
  'district-5': District5Reading,
  'district-6': District6Reading,
  'district-7': District7Reading,
  'district-9': District9Reading,
  'district-10': District10Reading,
  'district-11': District11Reading,
  'binh-thanh': BinhThanhReading,
  'phu-nhuan': PhuNhuanReading,
  'tan-phu': TanPhuReading,
  'thu-duc': ThuDucReading,
  'binh-tan': BinhTanReading,
  'hcmc': HCMCReading
};

const DISTRICT_LABELS = {
  'district-1': 'Quận 1',
  'district-2': 'Quận 2',
  'district-3': 'Quận 3',
  'district-4': 'Quận 4',
  'district-5': 'Quận 5',
  'district-6': 'Quận 6',
  'district-7': 'Quận 7',
  'district-9': 'Quận 9',
  'district-10': 'Quận 10',
  'district-11': 'Quận 11',
  'binh-thanh': 'Quận Bình Thạnh',
  'phu-nhuan': 'Quận Phú Nhuận',
  'tan-phu': 'Quận Tân Phú',
  'thu-duc': 'Quận Thủ Đức',
  'binh-tan': 'Quận Bình Tân',
  'hcmc': 'TP. HCM'
};

// [GET] /admin/aqi - Danh sách AQI của tất cả quận
module.exports.index = async (req, res) => {
  try {
    const aqiData = [];
    
    // Lấy dữ liệu AQI mới nhất từ mỗi quận
    for (const [key, Model] of Object.entries(DISTRICT_MODELS)) {
      const latestReading = await Model
        .findOne({ 'current.pollution.ts': { $exists: true } })
        .sort({ 'current.pollution.ts': -1 })
        .select('city state current.pollution')
        .lean();

      if (latestReading) {
        aqiData.push({
          districtId: key,
          districtName: DISTRICT_LABELS[key],
          city: latestReading.city,
          state: latestReading.state,
          aqius: latestReading.current?.pollution?.aqius || 'N/A',
          mainus: latestReading.current?.pollution?.mainus || 'N/A',
          aqicn: latestReading.current?.pollution?.aqicn || 'N/A',
          maincn: latestReading.current?.pollution?.maincn || 'N/A',
          timestamp: latestReading.current?.pollution?.ts || new Date(),
          formattedTime: latestReading.current?.pollution?.ts 
            ? new Date(latestReading.current.pollution.ts).toLocaleString('vi-VN')
            : 'N/A'
        });
      }
    }

    // Sắp xếp theo AQI US giảm dần (cao nhất trước)
    aqiData.sort((a, b) => {
      const aVal = typeof a.aqius === 'number' ? a.aqius : 0;
      const bVal = typeof b.aqius === 'number' ? b.aqius : 0;
      return bVal - aVal;
    });

    req.flash('success', `Tổng cộng ${aqiData.length} quận`);
    res.render('admin/pages/aqi/index', {
      title: 'Quản lý AQI',
      data: aqiData,
      districtLabels: DISTRICT_LABELS
    });
  } catch (error) {
    console.error('Error in AQI index:', error);
    req.flash('error', 'Lỗi khi tải dữ liệu AQI');
    res.render('admin/pages/aqi/index', {
      title: 'Quản lý AQI',
      data: [],
      districtLabels: DISTRICT_LABELS
    });
  }
};

// [GET] /admin/aqi/detail/:district - Chi tiết AQI theo quận
module.exports.detail = async (req, res) => {
  try {
    const { district } = req.params;
    const Model = DISTRICT_MODELS[district];

    if (!Model) {
      req.flash('error', 'Quận/huyện không tìm thấy');
      return res.redirect('/admin/aqi');
    }

    // Lấy 30 bản ghi gần nhất
    const readings = await Model
      .find({ 'current.pollution.ts': { $exists: true } })
      .sort({ 'current.pollution.ts': -1 })
      .limit(30)
      .select('city current.pollution current.weather')
      .lean();

    const formattedReadings = readings.map(r => ({
      ...r,
      formattedTime: r.current?.pollution?.ts 
        ? new Date(r.current.pollution.ts).toLocaleString('vi-VN')
        : 'N/A'
    }));

    res.render('admin/pages/aqi/detail', {
      title: `Chi tiết AQI - ${DISTRICT_LABELS[district]}`,
      district,
      districtLabel: DISTRICT_LABELS[district],
      data: formattedReadings
    });
  } catch (error) {
    console.error('Error in AQI detail:', error);
    req.flash('error', 'Lỗi khi tải chi tiết AQI');
    res.redirect('/admin/aqi');
  }
};

// [GET] /admin/aqi/export - Export dữ liệu AQI
module.exports.export = async (req, res) => {
  try {
    const { district, format = 'csv' } = req.query;
    let exportData = [];

    if (district && DISTRICT_MODELS[district]) {
      // Export dữ liệu 1 quận
      const readings = await DISTRICT_MODELS[district]
        .find({ 'current.pollution.ts': { $exists: true } })
        .sort({ 'current.pollution.ts': -1 })
        .select('city current.pollution current.weather')
        .lean();

      exportData = readings.map(r => ({
        City: r.city || 'N/A',
        AQI_US: r.current?.pollution?.aqius || 'N/A',
        Main_US: r.current?.pollution?.mainus || 'N/A',
        AQI_CN: r.current?.pollution?.aqicn || 'N/A',
        Main_CN: r.current?.pollution?.maincn || 'N/A',
        Timestamp: r.current?.pollution?.ts || 'N/A'
      }));
    } else {
      // Export dữ liệu tất cả quận (bản ghi mới nhất mỗi quận)
      for (const [key, Model] of Object.entries(DISTRICT_MODELS)) {
        const latestReading = await Model
          .findOne({ 'current.pollution.ts': { $exists: true } })
          .sort({ 'current.pollution.ts': -1 })
          .select('city current.pollution')
          .lean();

        if (latestReading) {
          exportData.push({
            District: DISTRICT_LABELS[key],
            City: latestReading.city || 'N/A',
            AQI_US: latestReading.current?.pollution?.aqius || 'N/A',
            Main_US: latestReading.current?.pollution?.mainus || 'N/A',
            AQI_CN: latestReading.current?.pollution?.aqicn || 'N/A',
            Main_CN: latestReading.current?.pollution?.maincn || 'N/A',
            Timestamp: latestReading.current?.pollution?.ts || 'N/A'
          });
        }
      }
    }

    if (format === 'csv') {
      const csv = json2csv({ data: exportData });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=aqi-data.csv');
      res.send(csv);
    } else if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=aqi-data.json');
      res.send(JSON.stringify(exportData, null, 2));
    }
  } catch (error) {
    console.error('Error in AQI export:', error);
    req.flash('error', 'Lỗi khi export dữ liệu');
    res.redirect('/admin/aqi');
  }
};

// [GET] /admin/aqi/api/chart/:district - Lấy dữ liệu cho biểu đồ AQI
module.exports.getChartData = async (req, res) => {
  try {
    const { district } = req.params;
    const Model = DISTRICT_MODELS[district];

    if (!Model) {
      return res.status(404).json({ error: 'District not found' });
    }

    // Lấy 30 bản ghi gần nhất
    const readings = await Model
      .find({ 'current.pollution.ts': { $exists: true } })
      .sort({ 'current.pollution.ts': -1 })
      .limit(30)
      .select('current.pollution.ts current.pollution.aqius current.pollution.mainus')
      .lean();

    // Reverse để sắp xếp từ cũ đến mới
    readings.reverse();

    const chartData = {
      labels: readings.map(r => {
        const date = new Date(r.current.pollution.ts);
        return date.toLocaleString('vi-VN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
      }),
      datasets: [
        {
          label: 'AQI US',
          data: readings.map(r => r.current?.pollution?.aqius || null),
          borderColor: '#0d6efd',
          backgroundColor: 'rgba(13, 110, 253, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#0d6efd',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        },
        {
          label: 'AQI CN',
          data: readings.map(r => r.current?.pollution?.aqicn || null),
          borderColor: '#198754',
          backgroundColor: 'rgba(25, 135, 84, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#198754',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }
      ]
    };

    res.json(chartData);
  } catch (error) {
    console.error('Error in AQI getChartData:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
