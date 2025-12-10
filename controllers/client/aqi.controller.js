// © 2025 SIU_Sirocco – Phát hành theo GPL-3.0
// This file is part of Eco-Track.
// Eco-Track is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License.
// Eco-Track is distributed WITHOUT ANY WARRANTY; see LICENSE for details.
// See LICENSE in the project root for full license text.
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
  if (aqius <= 50)  return { level: 'good',                     label: 'Tốt',       color: '#2ecc71' };
  if (aqius <= 100) return { level: 'moderate',                 label: 'Trung bình',color: '#f1c40f' };
  if (aqius <= 150) return { level: 'unhealthy-for-sensitive',  label: 'Nhạy cảm',  color: '#f1c40f' };
  if (aqius <= 200) return { level: 'unhealthy',                label: 'Xấu',       color: '#e67e22' };
  if (aqius <= 300) return { level: 'very-unhealthy',           label: 'Rất xấu',   color: '#8e44ad' };
  return             { level: 'hazardous',                      label: 'Nguy hại',  color: '#e74c3c' };
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
  'hcmc': models.HCMCReading,
  'district1': models.District1Reading,
  'district2': models.District2Reading,
  'district3': models.District3Reading,
  'district4': models.District4Reading,
  'district5': models.District5Reading,
  'district6': models.District6Reading,
  'district7': models.District7Reading,
  'district9': models.District9Reading,
  'district10': models.District10Reading,
  'district11': models.District11Reading,
  'binhtan': models.BinhTanReading,
  'binhthanh': models.BinhThanhReading,
  'phunhuan': models.PhuNhuanReading,
  'tanphu': models.TanPhuReading,
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
    let idx = 0;
    for (const [modelName, Model] of entries) {
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
            idx: String(idx),
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
        idx++;
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

// [GET] /aqi/by-datetime/:cityKey?startDate=...&endDate=...
module.exports.byDateTime = async (req, res) => {
  try {
    const cityKey = String(req.params.cityKey || '').toLowerCase();
    const Model = CITY_MODEL_MAP[cityKey];
    if (!Model) return res.status(404).json({ error: 'Unknown cityKey' });

    const { startDate, endDate } = req.query;
    
    // Tạo query filter cho khoảng thời gian
    const filter = { 'current.pollution.ts': { $exists: true } };
    
    if (startDate) {
      const start = new Date(startDate);
      if (isNaN(start.getTime())) {
        return res.status(400).json({ error: 'Invalid startDate format' });
      }
      filter['current.pollution.ts'] = { ...filter['current.pollution.ts'], $gte: start.toISOString() };
    }
    
    if (endDate) {
      const end = new Date(endDate);
      if (isNaN(end.getTime())) {
        return res.status(400).json({ error: 'Invalid endDate format' });
      }
      filter['current.pollution.ts'] = { ...filter['current.pollution.ts'], $lte: end.toISOString() };
    }

    const docs = await Model.find(filter)
      .sort({ 'current.pollution.ts': -1 })
      .select('city current.pollution current.weather')
      .lean();

    const readings = docs.map(d => ({
      ts: d.current?.pollution?.ts,
      aqius: d.current?.pollution?.aqius,
      mainus: d.current?.pollution?.mainus,
      temperature: d.current?.weather?.tp,
      humidity: d.current?.weather?.hu,
      pressure: d.current?.weather?.pr,
      windSpeed: d.current?.weather?.ws,
      meta: aqiMeta(d.current?.pollution?.aqius || 0)
    })).filter(r => r.ts);

    res.json({
      success: true,
      city: docs?.[0]?.city || cityKey,
      cityKey,
      count: readings.length,
      startDate,
      endDate,
      readings
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load data by datetime', details: e.message });
  }
};

// [GET] /aqi/compare - So sánh AQI giữa tất cả các quận
module.exports.compareDistricts = async (req, res) => {
  try {
    const comparisons = [];
    
    for (const [cityKey, Model] of Object.entries(CITY_MODEL_MAP)) {
      const doc = await Model.findOne({ 'current.pollution.ts': { $exists: true } })
        .sort({ 'current.pollution.ts': -1 })
        .select('city current.pollution.aqius current.pollution.ts current.weather')
        .lean();

      if (doc && doc.current?.pollution?.aqius != null) {
        const aqius = doc.current.pollution.aqius;
        comparisons.push({
          cityKey,
          city: doc.city,
          aqius,
          ts: doc.current.pollution.ts,
          temperature: doc.current?.weather?.tp,
          meta: aqiMeta(aqius)
        });
      }
    }

    comparisons.sort((a, b) => a.aqius - b.aqius);
    const best = comparisons[0];
    const worst = comparisons[comparisons.length - 1];
    const average = comparisons.reduce((sum, c) => sum + c.aqius, 0) / comparisons.length;

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      total: comparisons.length,
      statistics: {
        best: { city: best?.city, cityKey: best?.cityKey, aqius: best?.aqius, meta: best?.meta },
        worst: { city: worst?.city, cityKey: worst?.cityKey, aqius: worst?.aqius, meta: worst?.meta },
        average: Math.round(average * 100) / 100,
        averageMeta: aqiMeta(average)
      },
      districts: comparisons
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to compare districts', details: e.message });
  }
};

// [GET] /aqi/statistics/:cityKey - Thống kê AQI (min, max, avg, median, phân bố)
module.exports.statistics = async (req, res) => {
  try {
    const cityKey = String(req.params.cityKey || '').toLowerCase();
    const Model = CITY_MODEL_MAP[cityKey];
    if (!Model) return res.status(404).json({ error: 'Unknown cityKey' });

    const hours = parseInt(req.query.hours || '24', 10);
    const limit = Math.min(Math.max(hours, 1), 168);

    const docs = await Model.find({ 'current.pollution.ts': { $exists: true } })
      .sort({ 'current.pollution.ts': -1 })
      .limit(limit)
      .select('current.pollution.aqius current.pollution.ts')
      .lean();

    if (!docs || docs.length === 0) {
      return res.json({ success: false, message: 'No data available' });
    }

    const values = docs.map(d => d.current?.pollution?.aqius).filter(v => v != null);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    const distribution = { good: 0, moderate: 0, unhealthy: 0, veryUnhealthy: 0, hazardous: 0 };
    values.forEach(v => {
      if (v <= 50) distribution.good++;
      else if (v <= 100) distribution.moderate++;
      else if (v <= 200) distribution.unhealthy++;
      else if (v <= 300) distribution.veryUnhealthy++;
      else distribution.hazardous++;
    });

    res.json({
      success: true,
      cityKey,
      period: { hours: limit, dataPoints: values.length },
      statistics: {
        min: { value: min, meta: aqiMeta(min) },
        max: { value: max, meta: aqiMeta(max) },
        average: { value: Math.round(avg * 100) / 100, meta: aqiMeta(avg) },
        median: { value: median, meta: aqiMeta(median) }
      },
      distribution
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to get statistics', details: e.message });
  }
};

// [GET] /aqi/trend/:cityKey - Phân tích xu hướng tăng/giảm
module.exports.trend = async (req, res) => {
  try {
    const cityKey = String(req.params.cityKey || '').toLowerCase();
    const Model = CITY_MODEL_MAP[cityKey];
    if (!Model) return res.status(404).json({ error: 'Unknown cityKey' });

    const hours = parseInt(req.query.hours || '24', 10);
    const limit = Math.min(Math.max(hours, 6), 168);

    const docs = await Model.find({ 'current.pollution.ts': { $exists: true } })
      .sort({ 'current.pollution.ts': -1 })
      .limit(limit)
      .select('current.pollution.aqius current.pollution.ts')
      .lean();

    if (!docs || docs.length < 2) {
      return res.json({ success: false, message: 'Not enough data for trend analysis' });
    }

    const points = docs
      .map(d => ({ ts: new Date(d.current?.pollution?.ts), aqius: d.current?.pollution?.aqius }))
      .filter(p => p.ts && p.aqius != null)
      .sort((a, b) => a.ts - b.ts);

    const first = points[0].aqius;
    const last = points[points.length - 1].aqius;
    const change = last - first;
    const changePercent = (change / first) * 100;

    let increases = 0, decreases = 0;
    for (let i = 1; i < points.length; i++) {
      if (points[i].aqius > points[i - 1].aqius) increases++;
      else if (points[i].aqius < points[i - 1].aqius) decreases++;
    }

    let trend = 'stable';
    if (Math.abs(changePercent) < 5) trend = 'stable';
    else if (changePercent > 0) trend = 'increasing';
    else trend = 'decreasing';

    res.json({
      success: true,
      cityKey,
      period: { hours: limit, dataPoints: points.length },
      trend: {
        direction: trend,
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100,
        first: { value: first, meta: aqiMeta(first), ts: points[0].ts },
        last: { value: last, meta: aqiMeta(last), ts: points[points.length - 1].ts }
      },
      analysis: {
        increases,
        decreases,
        stable: points.length - 1 - increases - decreases
      }
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to analyze trend', details: e.message });
  }
};

// [GET] /aqi/filter - Lọc dữ liệu theo điều kiện (AQI, nhiệt độ, level)
module.exports.filter = async (req, res) => {
  try {
    const cityKey = String(req.query.cityKey || '').toLowerCase();
    const Model = CITY_MODEL_MAP[cityKey];
    if (!Model) return res.status(404).json({ error: 'cityKey parameter required' });

    const { minAqi, maxAqi, level, minTemp, maxTemp, limit = 50 } = req.query;
    const query = { 'current.pollution.ts': { $exists: true } };

    if (minAqi) query['current.pollution.aqius'] = { $gte: parseInt(minAqi, 10) };
    if (maxAqi) {
      query['current.pollution.aqius'] = { 
        ...query['current.pollution.aqius'], 
        $lte: parseInt(maxAqi, 10) 
      };
    }

    if (minTemp) query['current.weather.tp'] = { $gte: parseFloat(minTemp) };
    if (maxTemp) {
      query['current.weather.tp'] = { 
        ...query['current.weather.tp'], 
        $lte: parseFloat(maxTemp) 
      };
    }

    const docs = await Model.find(query)
      .sort({ 'current.pollution.ts': -1 })
      .limit(parseInt(limit, 10))
      .select('current.pollution current.weather')
      .lean();

    let results = docs.map(d => ({
      ts: d.current?.pollution?.ts,
      aqius: d.current?.pollution?.aqius,
      temperature: d.current?.weather?.tp,
      humidity: d.current?.weather?.hu,
      meta: aqiMeta(d.current?.pollution?.aqius || 0)
    }));

    if (level) {
      results = results.filter(r => r.meta.level === level);
    }

    res.json({
      success: true,
      cityKey,
      filters: { minAqi, maxAqi, level, minTemp, maxTemp },
      count: results.length,
      results
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to filter data', details: e.message });
  }
};

// [GET] /aqi/export/:cityKey - Export dữ liệu CSV hoặc JSON
module.exports.exportData = async (req, res) => {
  try {
    const cityKey = String(req.params.cityKey || '').toLowerCase();
    const Model = CITY_MODEL_MAP[cityKey];
    if (!Model) return res.status(404).json({ error: 'Unknown cityKey' });

    const format = (req.query.format || 'json').toLowerCase();
    const hours = parseInt(req.query.hours || '24', 10);
    const limit = Math.min(Math.max(hours, 1), 168);

    const docs = await Model.find({ 'current.pollution.ts': { $exists: true } })
      .sort({ 'current.pollution.ts': -1 })
      .limit(limit)
      .select('city current.pollution current.weather')
      .lean();

    const data = docs.map(d => ({
      timestamp: d.current?.pollution?.ts,
      city: d.city,
      aqi: d.current?.pollution?.aqius,
      mainPollutant: d.current?.pollution?.mainus,
      temperature: d.current?.weather?.tp,
      humidity: d.current?.weather?.hu,
      pressure: d.current?.weather?.pr,
      windSpeed: d.current?.weather?.ws,
      level: aqiMeta(d.current?.pollution?.aqius || 0).label
    }));

    if (format === 'csv') {
      const headers = Object.keys(data[0] || {});
      const csvRows = [
        headers.join(','),
        ...data.map(row => headers.map(h => JSON.stringify(row[h] || '')).join(','))
      ];
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${cityKey}_aqi_export.csv"`);
      return res.send(csvRows.join('\n'));
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${cityKey}_aqi_export.json"`);
    res.json({
      exportDate: new Date().toISOString(),
      cityKey,
      totalRecords: data.length,
      data
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to export data', details: e.message });
  }
};

// [GET] /aqi/hourly-average/:cityKey - Trung bình AQI theo từng giờ trong ngày
module.exports.hourlyAverage = async (req, res) => {
  try {
    const cityKey = String(req.params.cityKey || '').toLowerCase();
    const Model = CITY_MODEL_MAP[cityKey];
    if (!Model) return res.status(404).json({ error: 'Unknown cityKey' });

    const days = parseInt(req.query.days || '7', 10);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const docs = await Model.find({
      'current.pollution.ts': { $gte: cutoff.toISOString(), $exists: true }
    })
      .select('current.pollution.aqius current.pollution.ts')
      .lean();

    const hourlyData = {};
    docs.forEach(d => {
      const ts = new Date(d.current?.pollution?.ts);
      const hour = ts.getHours();
      const aqius = d.current?.pollution?.aqius;
      
      if (aqius != null) {
        if (!hourlyData[hour]) hourlyData[hour] = [];
        hourlyData[hour].push(aqius);
      }
    });

    const hourlyAverages = Object.keys(hourlyData).map(hour => {
      const values = hourlyData[hour];
      const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
      return {
        hour: parseInt(hour, 10),
        average: Math.round(avg * 100) / 100,
        samples: values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        meta: aqiMeta(avg)
      };
    }).sort((a, b) => a.hour - b.hour);

    res.json({
      success: true,
      cityKey,
      period: `Last ${days} days`,
      hourlyAverages
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to calculate hourly averages', details: e.message });
  }
};