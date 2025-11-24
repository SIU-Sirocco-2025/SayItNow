// ...existing code...
const models = require('../../models');

// Helpers
function normalize(s = '') {
  return String(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function aqiMeta(aqius) {
  if (aqius <= 50)  return { level: 'good',           label: 'Tốt',        color: '#2ecc71' };
  if (aqius <= 100) return { level: 'moderate',       label: 'Trung bình', color: '#f1c40f' };
  if (aqius <= 150) return { level: 'unhealthy-sg',   label: 'Nhạy cảm',   color: '#e67e22' };
  if (aqius <= 200) return { level: 'unhealthy',      label: 'Xấu',        color: '#e67e22' };
  if (aqius <= 300) return { level: 'very-unhealthy', label: 'Rất xấu',    color: '#8e44ad' };
  return             { level: 'hazardous',      label: 'Nguy hại',    color: '#e74c3c' };
}

function intensityFromAQI(aqius) {
  if (aqius <= 50)  return 0.20;
  if (aqius <= 100) return 0.40;
  if (aqius <= 150) return 0.60;
  if (aqius <= 200) return 0.75;
  if (aqius <= 300) return 0.90;
  return 1.00;
}

const CITY_MODEL_MAP = {
  'hochiminhcity': models.HCMCReading,
  'quan1': models.District1Reading,
  'quan2': models.District2Reading,
  'quan3': models.District3Reading,
  'quan4': models.District4Reading,
  'quan5': models.District5Reading,
  'quan6': models.District6Reading,
  'quan7': models.District7Reading,
  'quan9': models.District9Reading,
  'quan10': models.District10Reading,
  'quan11': models.District11Reading,
  'quanbinhtan': models.BinhTanReading,
  'quanphunhuan': models.PhuNhuanReading,
  'quanbinhthanh': models.BinhThanhReading,
  'thuduc': models.ThuDucReading
};

// [GET] /aqi
module.exports.page = async (req, res) => {
  try {
    res.render('client/pages/aqi/index', { title: 'Bản đồ AQI' });
  } catch (e) {
    res.status(500).send('Failed to render AQI map');
  }
};

// [GET] /aqi/history/:cityKey?limit=24
module.exports.history = async (req, res) => {
  try {
    const cityKey = String(req.params.cityKey || '').toLowerCase();
    const limit = Math.min(Math.max(parseInt(req.query.limit || '24', 10), 1), 168);
    const Model = CITY_MODEL_MAP[cityKey];
    if (!Model) return res.status(404).json({ error: 'unknown cityKey' });

    const docs = await Model.find()
      .sort({ 'current.pollution.ts': -1 })
      .limit(limit)
      .select('city current.pollution.ts current.pollution.aqius')
      .lean();

    const points = (docs || [])
      .map(d => ({ ts: d.current?.pollution?.ts, aqius: d.current?.pollution?.aqius }))
      .filter(p => p.ts && typeof p.aqius === 'number')
      .sort((a, b) => new Date(a.ts) - new Date(b.ts)); // tăng dần thời gian

    res.json({
      city: docs?.[0]?.city || cityKey,
      cityKey,
      points
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load history' });
  }
};

module.exports.latestPoints = async (req, res) => {
  try {
    const entries = Object.entries(models).filter(([k]) => k.endsWith('Reading'));
    const features = [];
    for (const [, Model] of entries) {
      const doc = await Model.findOne()
        .sort({ 'current.pollution.ts': -1 })
        .select('city state country location current.pollution.aqius current.pollution.ts')
        .lean();
      const coords = doc?.location?.coordinates; // [lon, lat]
      const aqius = doc?.current?.pollution?.aqius;
      const ts = doc?.current?.pollution?.ts;

      if (coords && Array.isArray(coords) && coords.length === 2 && typeof aqius === 'number') {
        const meta = aqiMeta(aqius);
        features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: coords },
          properties: {
            city: doc.city,
            cityKey: normalize(doc.city), // thêm key đã chuẩn hoá để join với ranh giới quận nếu cần
            state: doc.state,
            country: doc.country,
            aqius,
            ts,
            level: meta.level,
            label: meta.label,
            color: meta.color,
            intensity: intensityFromAQI(aqius)
          }
        });
      }
    }
    res.json({ type: 'FeatureCollection', features });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load AQI points' });
  }
};

// [GET] /aqi/hour-latest
module.exports.latestCityHour = async (req, res) => {
  try {
    const doc = await models.HCMCAirHour.findOne()
      .sort({ from: -1 })
      .lean();
    if (!doc) {
      return res.json({ success: false, message: 'No hour data' });
    }
    // Chuẩn hoá measurements -> mảng để dễ render
    const measurements = Object.values(doc.measurements || {}).map(m => ({
      key: m.parameter,
      value: m.value,
      unit: m.unit,
      fromLocal: m.from,
      toLocal: m.to
    }));
    return res.json({
      success: true,
      from: doc.from,
      to: doc.to,
      window: doc.window,
      total: measurements.length,
      measurements
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// [GET] /aqi/latest-reading
module.exports.latestCityReading = async (req, res) => {
  try {
    const doc = await models.HCMCReading
      .findOne({ 'current.pollution.ts': { $exists: true } })
      .sort({ 'current.pollution.ts': -1 })
      .lean();
    if (!doc) return res.json({ success: false });
    return res.json({
      success: true,
      aqius: doc.current?.pollution?.aqius,
      tp: doc.current?.weather?.tp,
      ts: doc.current?.pollution?.ts
    });
  } catch {
    return res.json({ success: false });
  }
};