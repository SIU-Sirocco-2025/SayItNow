// © 2025 SIU_Sirocco – Phát hành theo GPL-3.0
// This file is part of Eco-Track.
// Eco-Track is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License.
// Eco-Track is distributed WITHOUT ANY WARRANTY; see LICENSE for details.
// See LICENSE in the project root for full license text.

const axios = require('axios');
const cron = require('node-cron');
require('dotenv').config();
const moment = require('moment');

const database = require('../config/database');
database.connect();

const { HCMCAirHour } = require('../models');

const API_BASE = process.env.OPENAQ_API_BASE || 'https://api.openaq.org/v3';
const API_KEY = process.env.OPENAQ_API_KEY;
const CRON_EXPR = process.env.OPENAQ_FETCH_INTERVAL || '0 * * * *'; // mỗi giờ phút 00

// Danh sách sensor ID cần lấy
const SENSOR_IDS = [11357396,11357395,11357424,11357398,11357401,11357394];

const AX = axios.create({
  baseURL: API_BASE,
  timeout: 15000
});

AX.interceptors.request.use(cfg => {
  cfg.headers['x-api-key'] = API_KEY;
  return cfg;
});

// Tránh chồng lấn job
let isRunning = false;

// Chuẩn hóa một record trả về
function cleanRecord(raw) {
  const p = raw.parameter || {};
  const period = raw.period || {};
  const fromLocal = period?.datetimeFrom?.local;
  const toLocal = period?.datetimeTo?.local;
  return {
    parameter: p.name || p.key || p.displayName || p.parameter || raw.parameter?.name || 'unknown',
    value: raw.value,
    unit: p.units || raw.parameter?.units,
    from: fromLocal,
    to: toLocal
  };
}

// Lấy giờ từ một sensor
async function fetchSensorHours(sensorId, fromUtcISO, toUtcISO) {
  const params = {
    datetime_from: fromUtcISO,
    datetime_to: toUtcISO,
    limit: 100
  };
  const url = `/sensors/${sensorId}/hours`;
  const res = await AX.get(url, { params, validateStatus: () => true });
  if (res.status !== 200) {
    console.log(`[WARN] Sensor ${sensorId} http=${res.status}`);
    return [];
  }
  const results = res.data?.results || [];
  return results.map(r => ({ sensorId, raw: r, cleaned: cleanRecord(r) }));
}

// Gom theo giờ (key = cleaned.from)
function aggregateByHour(allRecords) {
  const buckets = new Map();

  for (const rec of allRecords) {
    const c = rec.cleaned;
    if (!c.from || !c.to) continue; // thiếu dữ liệu
    const key = c.from; // from local (ví dụ '2025-11-20T09:00:00+07:00')
    if (!buckets.has(key)) {
      buckets.set(key, {
        fromLocal: c.from,
        toLocal: c.to,
        raw: [],
        measurements: {}
      });
    }
    const bucket = buckets.get(key);
    // Nếu parameter đã tồn tại thì giữ bản đầu (hoặc có thể ghi đè tuỳ chiến lược)
    if (!bucket.measurements[c.parameter]) {
      bucket.measurements[c.parameter] = c;
    }
    bucket.raw.push(rec.raw);
  }

  // Chuyển thành docs để upsert
  const docs = [];
  for (const [fromLocal, data] of buckets.entries()) {
    // Chuyển fromLocal -> UTC Date (parse bằng moment)
    const fromUtc = moment(fromLocal).utc().toDate();
    const toUtc = moment(data.toLocal).utc().toDate();

    docs.push({
      from: fromUtc,
      to: toUtc,
      window: {
        fromLocal: data.fromLocal,
        toLocal: data.toLocal
      },
      measurements: data.measurements,
      raw: data.raw
    });
  }
  return docs;
}

// Lấy mốc bắt đầu (last saved hour)
async function getLastHourStart() {
  const last = await HCMCAirHour.findOne().sort({ to: -1 }).lean();
  if (last) return last.to; // Date UTC
  // Nếu chưa có dữ liệu: lùi 100 giờ để backfill nhẹ
  return new Date(Date.now() -100 * 60 * 60 * 1000);
}

// Chạy một lượt
async function runOnce() {
  if (isRunning) {
    console.log('[INFO] Job trước chưa xong, bỏ qua tick.');
    return;
  }
  isRunning = true;
  try {
    if (!API_KEY) {
      console.error('Thiếu OPENAQ_API_KEY trong .env');
      return;
    }

    const lastFrom = await getLastHourStart(); // Date
    // datetime_from gửi lên: lastFrom UTC ISO
    const fromUtcISO = new Date(lastFrom).toISOString();
    const nowUtcISO = new Date().toISOString();

    console.log(`[INFO] Fetch hours từ ${fromUtcISO} -> ${nowUtcISO}`);

    const allRecords = [];
    for (const id of SENSOR_IDS) {
      try {
        const sensorRecords = await fetchSensorHours(id, fromUtcISO, nowUtcISO);
        allRecords.push(...sensorRecords);
        // Nhẹ nhàng giãn giữa các sensor để tránh limit
        await new Promise(r => setTimeout(r, 800));
      } catch (e) {
        console.log(`[ERROR] Sensor ${id} -> ${e.message}`);
      }
    }

    if (!allRecords.length) {
      console.log('[INFO] Không thu được record nào.');
      return;
    }

    const hourDocs = aggregateByHour(allRecords);
    for (const doc of hourDocs) {
      // Upsert theo to (UTC) để tránh trùng
      await HCMCAirHour.findOneAndUpdate(
        { to: doc.to },
        doc,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      const pm25 = doc.measurements.pm25?.value;
      console.log(`[SAVE] hour to=${doc.window.toLocal} pm25=${pm25 ?? 'N/A'}`);
    }
    console.log(`[DONE] Lưu ${hourDocs.length} khung giờ.`);
  } finally {
    isRunning = false;
  }
}

// Cron
cron.schedule(CRON_EXPR, () => {
  console.log(`[CRON] Tick ${new Date().toISOString()} -> runOnce()`);
  runOnce();
});

// Chạy ngay lần đầu
runOnce();