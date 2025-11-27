const models = require('../../models');

function formatLabel(name) {
  // Convert model key like 'District1Reading' to a readable label
  return name.replace(/Reading$/, '').replace(/([a-z])([A-Z])/g, '$1 $2');
}

async function index(req, res) {
  try {
    res.render('admin/pages/dashboard/index', {
      title: 'Dashboard Admin',
    });
  } catch (err) {
    res.status(500).send('Dashboard render error');
  }
}

async function getAQIChartData(req, res) {
  try {
    const districts = [];
    const aqi = [];

    const keys = Object.keys(models);
    const excludedModels = ['HCMCAirIndex', 'HCMCAirHour'];
    
    for (const key of keys) {
      if (excludedModels.includes(key)) continue;
      
      const Model = models[key];
      const doc = await Model.findOne({}, { 'current.pollution.aqius': 1, 'current.pollution.ts': 1 }).sort({ 'current.pollution.ts': -1 }).lean().exec();
      districts.push(formatLabel(key));
      aqi.push(doc && doc.current && doc.current.pollution ? (doc.current.pollution.aqius || null) : null);
    }

    res.json({ success: true, districts, aqi });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function getTempChartData(req, res) {
  try {
    const districts = [];
    const temps = [];
    const humidities = [];

    const keys = Object.keys(models);
    const excludedModels = ['HCMCAirIndex', 'HCMCAirHour'];
    
    for (const key of keys) {
      if (excludedModels.includes(key)) continue;
      
      const Model = models[key];
      const doc = await Model.findOne({}, { 'current.weather.tp': 1, 'current.weather.hu': 1, 'current.weather.ts': 1 }).sort({ 'current.weather.ts': -1 }).lean().exec();
      districts.push(formatLabel(key));
      temps.push(doc && doc.current && doc.current.weather ? (doc.current.weather.tp || null) : null);
      humidities.push(doc && doc.current && doc.current.weather ? (doc.current.weather.hu || null) : null);
    }

    res.json({ success: true, districts, temps, humidities });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function getAlertData(req, res) {
  try {
    const AQI_THRESHOLD = 150;
    const alerts = [];

    const keys = Object.keys(models);
    const excludedModels = ['HCMCAirIndex', 'HCMCAirHour'];
    
    for (const key of keys) {
      if (excludedModels.includes(key)) continue;
      
      const Model = models[key];
      const doc = await Model.findOne({}, { 'current.pollution.aqius': 1 }).sort({ 'current.pollution.ts': -1 }).lean().exec();
      const aqius = doc && doc.current && doc.current.pollution ? (doc.current.pollution.aqius || null) : null;
      
      if (aqius && aqius >= AQI_THRESHOLD) {
        alerts.push({
          district: formatLabel(key),
          aqi: aqius,
          status: aqius >= 200 ? 'Rất ô nhiễm' : aqius >= 150 ? 'Ô nhiễm' : 'Cảnh báo'
        });
      }
    }

    alerts.sort((a, b) => b.aqi - a.aqi);
    res.json({ success: true, alerts: alerts.slice(0, 10) });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function getRankingData(req, res) {
  try {
    const allDistricts = [];
    const keys = Object.keys(models);
    const excludedModels = ['HCMCAirIndex', 'HCMCAirHour'];

    for (const key of keys) {
      if (excludedModels.includes(key)) continue;
      
      const Model = models[key];
      const doc = await Model.findOne({}, { 'current.pollution.aqius': 1 }).sort({ 'current.pollution.ts': -1 }).lean().exec();
      const aqius = doc && doc.current && doc.current.pollution ? (doc.current.pollution.aqius || null) : null;
      
      allDistricts.push({
        district: formatLabel(key),
        aqi: aqius || 0
      });
    }

    allDistricts.sort((a, b) => a.aqi - b.aqi);
    
    const best = allDistricts.slice(0, 3);
    const worst = allDistricts.slice(-3).reverse();
    
    // Calculate ratio
    const totalCount = allDistricts.length;
    const exceededCount = allDistricts.filter(d => d.aqi >= 150).length;
    const normalCount = totalCount - exceededCount;
    
    res.json({ 
      success: true, 
      best, 
      worst,
      ratio: {
        exceeded: exceededCount,
        normal: normalCount,
        total: totalCount
      }
    });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function get72HAQIData(req, res) {
  try {
    const districtKey = req.query.district || 'District1Reading';
    const Model = models[districtKey];
    
    if (!Model) {
      return res.json({ success: false, message: 'District not found' });
    }

    // Lấy 72 bản ghi gần nhất, sắp xếp theo thời gian
    const records = await Model.find({}, { 'current.pollution.aqius': 1, 'current.pollution.ts': 1 })
      .sort({ 'current.pollution.ts': -1 })
      .limit(72)
      .lean()
      .exec();

    // Đảo ngược để có thứ tự thời gian tăng dần
    records.reverse();

    const timestamps = records.map(r => {
      const date = new Date(r.current.pollution.ts);
      return date.toLocaleString('vi-VN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    });

    const aqiValues = records.map(r => r.current.pollution.aqius || null);

    // Lấy danh sách tất cả quận (bỏ HCMCAirIndex, HCMCAirHour, HCMCReading)
    const keys = Object.keys(models);
    const excludedModels = ['HCMCAirIndex', 'HCMCAirHour', 'HCMCReading'];
    const districts = keys.filter(k => !excludedModels.includes(k)).map(k => ({
      key: k,
      label: formatLabel(k)
    }));

    res.json({ 
      success: true, 
      district: formatLabel(districtKey),
      timestamps, 
      aqiValues,
      districts
    });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

module.exports = {
  index,
  getAQIChartData,
  getTempChartData,
  getAlertData,
  getRankingData,
  get72HAQIData
};
