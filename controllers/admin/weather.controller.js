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

// [GET] /admin/weather - Danh sách dữ liệu thời tiết
module.exports.index = async (req, res) => {
  try {
    const weatherData = [];

    // Lấy dữ liệu thời tiết mới nhất từ mỗi quận
    for (const [key, Model] of Object.entries(DISTRICT_MODELS)) {
      const latestReading = await Model
        .findOne({ 'current.weather.ts': { $exists: true } })
        .sort({ 'current.weather.ts': -1 })
        .select('city current.weather')
        .lean();

      if (latestReading) {
        weatherData.push({
          districtId: key,
          districtName: DISTRICT_LABELS[key],
          city: latestReading.city,
          temperature: latestReading.current?.weather?.tp ? parseFloat(latestReading.current.weather.tp.toFixed(1)) : 'N/A',
          humidity: latestReading.current?.weather?.hu ? parseFloat(latestReading.current.weather.hu.toFixed(1)) : 'N/A',
          pressure: latestReading.current?.weather?.pr ? parseFloat(latestReading.current.weather.pr.toFixed(1)) : 'N/A',
          windSpeed: latestReading.current?.weather?.ws ? parseFloat(latestReading.current.weather.ws.toFixed(2)) : 'N/A',
          windDirection: latestReading.current?.weather?.wd ? Math.round(latestReading.current.weather.wd) : 'N/A',
          iconCode: latestReading.current?.weather?.ic || 'N/A',
          heatIndex: latestReading.current?.weather?.heatIndex ? parseFloat(latestReading.current.weather.heatIndex.toFixed(1)) : 'N/A',
          timestamp: latestReading.current?.weather?.ts || new Date(),
          formattedTime: latestReading.current?.weather?.ts 
            ? new Date(latestReading.current.weather.ts).toLocaleString('vi-VN')
            : 'N/A'
        });
      }
    }

    // Sắp xếp theo nhiệt độ giảm dần
    weatherData.sort((a, b) => {
      const aTemp = typeof a.temperature === 'number' ? a.temperature : -273;
      const bTemp = typeof b.temperature === 'number' ? b.temperature : -273;
      return bTemp - aTemp;
    });

    req.flash('success', `Tổng cộng ${weatherData.length} quận`);
    res.render('admin/pages/weather/index', {
      title: 'Quản lý Thời tiết',
      data: weatherData,
      districtLabels: DISTRICT_LABELS
    });
  } catch (error) {
    console.error('Error in Weather index:', error);
    req.flash('error', 'Lỗi khi tải dữ liệu thời tiết');
    res.render('admin/pages/weather/index', {
      title: 'Quản lý Thời tiết',
      data: [],
      districtLabels: DISTRICT_LABELS
    });
  }
};

// [GET] /admin/weather/detail/:district - Chi tiết thời tiết theo quận
module.exports.detail = async (req, res) => {
  try {
    const { district } = req.params;
    const Model = DISTRICT_MODELS[district];

    if (!Model) {
      req.flash('error', 'Quận/huyện không tìm thấy');
      return res.redirect('/admin/weather');
    }

    // Lấy 30 bản ghi gần nhất
    const readings = await Model
      .find({ 'current.weather.ts': { $exists: true } })
      .sort({ 'current.weather.ts': -1 })
      .limit(30)
      .select('city current.weather')
      .lean();

    const formattedReadings = readings.map(r => ({
      city: r.city,
      current: {
        weather: {
          ts: r.current?.weather?.ts,
          tp: r.current?.weather?.tp ? parseFloat(r.current.weather.tp.toFixed(1)) : null,
          hu: r.current?.weather?.hu ? parseFloat(r.current.weather.hu.toFixed(1)) : null,
          pr: r.current?.weather?.pr ? parseFloat(r.current.weather.pr.toFixed(1)) : null,
          ws: r.current?.weather?.ws ? parseFloat(r.current.weather.ws.toFixed(2)) : null,
          wd: r.current?.weather?.wd ? Math.round(r.current.weather.wd) : null,
          heatIndex: r.current?.weather?.heatIndex ? parseFloat(r.current.weather.heatIndex.toFixed(1)) : null
        }
      },
      formattedTime: r.current?.weather?.ts 
        ? new Date(r.current.weather.ts).toLocaleString('vi-VN')
        : 'N/A'
    }));

    res.render('admin/pages/weather/detail', {
      title: `Chi tiết Thời tiết - ${DISTRICT_LABELS[district]}`,
      district,
      districtLabel: DISTRICT_LABELS[district],
      data: formattedReadings
    });
  } catch (error) {
    console.error('Error in Weather detail:', error);
    req.flash('error', 'Lỗi khi tải chi tiết thời tiết');
    res.redirect('/admin/weather');
  }
};

// [GET] /admin/weather/export - Export dữ liệu thời tiết
module.exports.export = async (req, res) => {
  try {
    const { district, format = 'csv' } = req.query;
    let exportData = [];

    if (district && DISTRICT_MODELS[district]) {
      // Export dữ liệu 1 quận
      const readings = await DISTRICT_MODELS[district]
        .find({ 'current.weather.ts': { $exists: true } })
        .sort({ 'current.weather.ts': -1 })
        .select('city current.weather')
        .lean();

      exportData = readings.map(r => ({
        City: r.city || 'N/A',
        Temperature: r.current?.weather?.tp || 'N/A',
        Humidity: r.current?.weather?.hu || 'N/A',
        Pressure: r.current?.weather?.pr || 'N/A',
        Wind_Speed: r.current?.weather?.ws || 'N/A',
        Wind_Direction: r.current?.weather?.wd || 'N/A',
        Heat_Index: r.current?.weather?.heatIndex || 'N/A',
        Timestamp: r.current?.weather?.ts || 'N/A'
      }));
    } else {
      // Export dữ liệu tất cả quận (bản ghi mới nhất mỗi quận)
      for (const [key, Model] of Object.entries(DISTRICT_MODELS)) {
        const latestReading = await Model
          .findOne({ 'current.weather.ts': { $exists: true } })
          .sort({ 'current.weather.ts': -1 })
          .select('city current.weather')
          .lean();

        if (latestReading) {
          exportData.push({
            District: DISTRICT_LABELS[key],
            City: latestReading.city || 'N/A',
            Temperature: latestReading.current?.weather?.tp || 'N/A',
            Humidity: latestReading.current?.weather?.hu || 'N/A',
            Pressure: latestReading.current?.weather?.pr || 'N/A',
            Wind_Speed: latestReading.current?.weather?.ws || 'N/A',
            Wind_Direction: latestReading.current?.weather?.wd || 'N/A',
            Heat_Index: latestReading.current?.weather?.heatIndex || 'N/A',
            Timestamp: latestReading.current?.weather?.ts || 'N/A'
          });
        }
      }
    }

    if (format === 'csv') {
      const csv = json2csv({ data: exportData });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=weather-data.csv');
      res.send(csv);
    } else if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=weather-data.json');
      res.send(JSON.stringify(exportData, null, 2));
    }
  } catch (error) {
    console.error('Error in Weather export:', error);
    req.flash('error', 'Lỗi khi export dữ liệu');
    res.redirect('/admin/weather');
  }
};

// [GET] /admin/weather/api/chart/:district - Lấy dữ liệu cho biểu đồ thời tiết
module.exports.getChartData = async (req, res) => {
  try {
    const { district } = req.params;
    const Model = DISTRICT_MODELS[district];

    if (!Model) {
      return res.status(404).json({ error: 'District not found' });
    }

    // Lấy 30 bản ghi gần nhất
    const readings = await Model
      .find({ 'current.weather.ts': { $exists: true } })
      .sort({ 'current.weather.ts': -1 })
      .limit(30)
      .select('current.weather.ts current.weather.tp current.weather.hu current.weather.pr current.weather.ws')
      .lean();

    // Reverse để sắp xếp từ cũ đến mới
    readings.reverse();

    const chartData = {
      labels: readings.map(r => {
        const date = new Date(r.current.weather.ts);
        return date.toLocaleString('vi-VN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
      }),
      datasets: [
        {
          label: 'Nhiệt độ (°C)',
          data: readings.map(r => r.current?.weather?.tp || null),
          borderColor: '#dc3545',
          backgroundColor: 'rgba(220, 53, 69, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#dc3545',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          yAxisID: 'y'
        },
        {
          label: 'Độ ẩm (%)',
          data: readings.map(r => r.current?.weather?.hu || null),
          borderColor: '#0dcaf0',
          backgroundColor: 'rgba(13, 202, 240, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#0dcaf0',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          yAxisID: 'y1'
        },
        {
          label: 'Tốc độ gió (m/s)',
          data: readings.map(r => r.current?.weather?.ws || null),
          borderColor: '#fd7e14',
          backgroundColor: 'rgba(253, 126, 20, 0.1)',
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          pointRadius: 3,
          pointBackgroundColor: '#fd7e14',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          yAxisID: 'y2'
        }
      ]
    };

    res.json(chartData);
  } catch (error) {
    console.error('Error in Weather getChartData:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
