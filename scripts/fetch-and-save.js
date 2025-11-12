const axios = require('axios');
const cron = require('node-cron');
require('dotenv').config();

const database = require('../config/database');
database.connect();

const models = require('../models');

const API_BASE = process.env.API_BASE || 'http://api.airvisual.com/v2/city';
const API_KEY = process.env.API_KEY;
const STATE = process.env.STATE || 'ho chi minh city';
const COUNTRY = process.env.COUNTRY || 'vietnam';

const DELAY_MS = parseInt(process.env.API_DELAY_MS || '6500', 10); // tránh rate limit
const MAX_RETRY = parseInt(process.env.API_MAX_RETRY || '3', 10);
let isRunning = false;
const CRON_ENABLED = String(process.env.CRON_ENABLED || '').toLowerCase() === '1' 
  || String(process.env.CRON_ENABLED || '').toLowerCase() === 'true';
// Bản đồ city -> model (14 quận)
const CITY_MAP = [
  { keys: ['ho chi minh city'], model: models.HCMCReading, label: 'Thành phố Hồ Chí Minh' },
  { keys: ['quan mot'], model: models.District1Reading, label: 'Quận 1' },
  { keys: ['quan hai'], model: models.District2Reading, label: 'Quận 2' },
  { keys: ['quan ba'], model: models.District3Reading, label: 'Quận 3' },
  { keys: ['quan bon'], model: models.District4Reading, label: 'Quận 4' },
  { keys: ['quan nam'], model: models.District5Reading, label: 'Quận 5' },
  { keys: ['quan sau'], model: models.District6Reading, label: 'Quận 6' },
  { keys: ['quan bay'], model: models.District7Reading, label: 'Quận 7' },
  { keys: ['quan chin'], model: models.District9Reading, label: 'Quận 9' },
  { keys: ['quan muoi'], model: models.District10Reading, label: 'Quận 10' },
  { keys: ['quan muoi mot'], model: models.District11Reading, label: 'Quận 11' },
  { keys: ['quan binh tan'], model: models.BinhTanReading, label: 'Bình Tân' },
  { keys: ['quan phu nhuan'], model: models.PhuNhuanReading, label: 'Phú Nhuận' },
  { keys: ['quan binh thanh'], model: models.BinhThanhReading, label: 'Bình Thạnh' },
  { keys: ['thu duc'], model: models.ThuDucReading, label: 'Thủ Đức' }
];

function buildUrl(city) {
  if (!API_KEY) throw new Error('Thiếu API_KEY trong .env');
  return `${API_BASE}?city=${encodeURIComponent(city)}&state=${encodeURIComponent(STATE)}&country=${encodeURIComponent(COUNTRY)}&key=${encodeURIComponent(API_KEY)}`;
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function toDoc(root) {
  const d = root.data || {};
  const pollution = d.current?.pollution || {};
  const weather = d.current?.weather || {};
  return {
    city: d.city,
    state: d.state,
    country: d.country,
    location: d.location,
    current: {
      pollution: {
        ts: pollution.ts ? new Date(pollution.ts) : undefined,
        aqius: pollution.aqius,
        mainus: pollution.mainus,
        aqicn: pollution.aqicn,
        maincn: pollution.maincn
      },
      weather: {
        ts: weather.ts ? new Date(weather.ts) : undefined,
        ic: weather.ic,
        hu: weather.hu,
        pr: weather.pr,
        tp: weather.tp,
        wd: weather.wd,
        ws: weather.ws,
        heatIndex: weather.tp
      }
    },
    raw: root
  };
}

async function fetchOneCity(city, attempt = 1) {
  const url = buildUrl(city);
  try {
    // Luôn trả về response để tự xử lý mã HTTP
    const res = await axios.get(url, {
      timeout: 15000,
      validateStatus: () => true
    });

    const http = res.status;
    const root = res.data || {};
    const apiStatus = root?.status;
    const message = (root?.data?.message || '').toLowerCase();

    // Thành công
    if (http === 200 && apiStatus === 'success') return root;

    // Bỏ qua nếu city_not_found (API mở ngẫu nhiên 5 trạm/ngày)
    if (message.includes('city_not_found')) {
      console.log(`[SKIP] ${city} -> city_not_found (http=${http})`);
      return null;
    }

    // Retry khi bị giới hạn
    if (http === 429 || message.includes('too many requests')) {
      if (attempt < MAX_RETRY) {
        const backoff = 50000 * attempt; // backoff 50s, 100s, ...
        console.log(`[RATE LIMIT] ${city} -> chờ ${backoff / 1000}s rồi thử lại (#${attempt + 1})`);
        await sleep(backoff);
        return fetchOneCity(city, attempt + 1);
      }
      console.log(`[RATE LIMIT] ${city} -> quá số lần retry, bỏ qua lượt này`);
      return null;
    }

    // Các lỗi khác
    throw new Error(message || `http=${http}`);
  } catch (e) {
    // Lỗi mạng -> thử lại nhẹ
    if (attempt < MAX_RETRY) {
      const backoff = 5000 * attempt;
      console.log(`[WARN] ${city} lỗi mạng: ${e.message}. Retry ${backoff / 1000}s (#${attempt + 1})`);
      await sleep(backoff);
      return fetchOneCity(city, attempt + 1);
    }
    throw e;
  }
}

async function saveWithModel(Model, root, label) {
  const doc = toDoc(root);
  const ts = doc.current.pollution.ts;
  if (!ts) {
    console.log(`[SKIP] ${label} thiếu pollution.ts`);
    return;
  }
  await Model.findOneAndUpdate(
    { 'current.pollution.ts': ts },
    doc,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.log(`[SAVE] ${label} ts=${ts.toISOString()} aqius=${doc.current.pollution.aqius}`);
}

async function runAll() {
  if (isRunning) {
    console.log('[INFO] Job trước chưa xong, bỏ qua tick.');
    return;
  }
  isRunning = true;
  try {
    for (const item of CITY_MAP) {
      let ok = false;
      for (const key of item.keys) {
        try {
          const root = await fetchOneCity(key);
          if (!root) {
            // city_not_found -> thử key tiếp theo nếu có
            continue;
          }
          await saveWithModel(item.model, root, item.label);
          ok = true;
          break;
        } catch (err) {
          console.log(`[WARN] ${item.label} city="${key}" -> ${err.message}`);
        }
      }
      if (!ok) console.log(`[INFO] Không có trạm hoạt động cho ${item.label} ở lượt này`);
      await sleep(DELAY_MS);
    }
  } finally {
    isRunning = false;
  }
}

// Cron mỗi giờ (phút 00), job tự tránh chồng lấn
if (CRON_ENABLED) {
  cron.schedule('0 * * * *', () => {
    console.log(`[${new Date().toISOString()}] Cron tick hourly -> runAll()`);
    runAll();
  });
} else {
  console.log('[CRON] Disabled (set CRON_ENABLED=1 to enable)');
}

// Chạy ngay khi start
runAll();