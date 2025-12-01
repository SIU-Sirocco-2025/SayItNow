// © 2025 SIU_Sirocco – Phát hành theo GPL-3.0
// This file is part of Eco-Track.
// Eco-Track is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License.
// Eco-Track is distributed WITHOUT ANY WARRANTY; see LICENSE for details.
// See LICENSE in the project root for full license text.

const HCMCAirHour = require('../models/hcmcAirHour.model');
const models = require('../models');

// Helper function để map city name sang district key
function getDistrictKey(cityName) {
  const mapping = {
    'Quận 1': 'district1',
    'Quận 2': 'district2',
    'Quận 3': 'district3',
    'Quận 4': 'district4',
    'Quận 5': 'district5',
    'Quận 6': 'district6',
    'Quận 7': 'district7',
    'Quận 9': 'district9',
    'Quận 10': 'district10',
    'Quận 11': 'district11',
    'Quận Bình Thạnh': 'binhThanh',
    'Quận Phú Nhuận': 'phuNhuan',
    'Quận Tân Phú': 'tanPhu',
    'Quận Bình Tân': 'binhTan',
    'Thủ Đức': 'thuDuc',
    'Ho Chi Minh City': 'hcmc'
  };
  return mapping[cityName] || 'hcmc';
}

// Hàm tính AQI US từ PM2.5
function calculatePM25AQI(pm25) {
  if (pm25 == null || pm25 < 0) return null;
  
  const breakpoints = [
    { cLow: 0.0, cHigh: 12.0, iLow: 0, iHigh: 50 },
    { cLow: 12.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
    { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },
    { cLow: 55.5, cHigh: 150.4, iLow: 151, iHigh: 200 },
    { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },
    { cLow: 250.5, cHigh: 350.4, iLow: 301, iHigh: 400 },
    { cLow: 350.5, cHigh: 500.4, iLow: 401, iHigh: 500 }
  ];

  for (const bp of breakpoints) {
    if (pm25 >= bp.cLow && pm25 <= bp.cHigh) {
      return Math.round(((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (pm25 - bp.cLow) + bp.iLow);
    }
  }
  
  return pm25 > 500.4 ? 500 : null;
}

// Hàm tính AQI từ PM10
function calculatePM10AQI(pm10) {
  if (pm10 == null || pm10 < 0) return null;
  
  const breakpoints = [
    { cLow: 0, cHigh: 54, iLow: 0, iHigh: 50 },
    { cLow: 55, cHigh: 154, iLow: 51, iHigh: 100 },
    { cLow: 155, cHigh: 254, iLow: 101, iHigh: 150 },
    { cLow: 255, cHigh: 354, iLow: 151, iHigh: 200 },
    { cLow: 355, cHigh: 424, iLow: 201, iHigh: 300 },
    { cLow: 425, cHigh: 504, iLow: 301, iHigh: 400 },
    { cLow: 505, cHigh: 604, iLow: 401, iHigh: 500 }
  ];

  for (const bp of breakpoints) {
    if (pm10 >= bp.cLow && pm10 <= bp.cHigh) {
      return Math.round(((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (pm10 - bp.cLow) + bp.iLow);
    }
  }
  
  return pm10 > 604 ? 500 : null;
}

// Hàm tính AQI từ O3
function calculateO3AQI(o3) {
  if (o3 == null || o3 < 0) return null;
  
  const breakpoints = [
    { cLow: 0, cHigh: 54, iLow: 0, iHigh: 50 },
    { cLow: 55, cHigh: 70, iLow: 51, iHigh: 100 },
    { cLow: 71, cHigh: 85, iLow: 101, iHigh: 150 },
    { cLow: 86, cHigh: 105, iLow: 151, iHigh: 200 },
    { cLow: 106, cHigh: 200, iLow: 201, iHigh: 300 }
  ];

  for (const bp of breakpoints) {
    if (o3 >= bp.cLow && o3 <= bp.cHigh) {
      return Math.round(((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (o3 - bp.cLow) + bp.iLow);
    }
  }
  
  return o3 > 200 ? 300 : null;
}

// Hàm tính AQI từ NO2
function calculateNO2AQI(no2) {
  if (no2 == null || no2 < 0) return null;
  
  const breakpoints = [
    { cLow: 0, cHigh: 53, iLow: 0, iHigh: 50 },
    { cLow: 54, cHigh: 100, iLow: 51, iHigh: 100 },
    { cLow: 101, cHigh: 360, iLow: 101, iHigh: 150 },
    { cLow: 361, cHigh: 649, iLow: 151, iHigh: 200 },
    { cLow: 650, cHigh: 1249, iLow: 201, iHigh: 300 },
    { cLow: 1250, cHigh: 1649, iLow: 301, iHigh: 400 },
    { cLow: 1650, cHigh: 2049, iLow: 401, iHigh: 500 }
  ];

  for (const bp of breakpoints) {
    if (no2 >= bp.cLow && no2 <= bp.cHigh) {
      return Math.round(((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (no2 - bp.cLow) + bp.iLow);
    }
  }
  
  return no2 > 2049 ? 500 : null;
}

// Hàm tính AQI từ SO2
function calculateSO2AQI(so2) {
  if (so2 == null || so2 < 0) return null;
  
  const breakpoints = [
    { cLow: 0, cHigh: 35, iLow: 0, iHigh: 50 },
    { cLow: 36, cHigh: 75, iLow: 51, iHigh: 100 },
    { cLow: 76, cHigh: 185, iLow: 101, iHigh: 150 },
    { cLow: 186, cHigh: 304, iLow: 151, iHigh: 200 },
    { cLow: 305, cHigh: 604, iLow: 201, iHigh: 300 },
    { cLow: 605, cHigh: 804, iLow: 301, iHigh: 400 },
    { cLow: 805, cHigh: 1004, iLow: 401, iHigh: 500 }
  ];

  for (const bp of breakpoints) {
    if (so2 >= bp.cLow && so2 <= bp.cHigh) {
      return Math.round(((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (so2 - bp.cLow) + bp.iLow);
    }
  }
  
  return so2 > 1004 ? 500 : null;
}

// Hàm tính AQI từ CO
function calculateCOAQI(co) {
  if (co == null || co < 0) return null;
  
  const breakpoints = [
    { cLow: 0, cHigh: 4.4, iLow: 0, iHigh: 50 },
    { cLow: 4.5, cHigh: 9.4, iLow: 51, iHigh: 100 },
    { cLow: 9.5, cHigh: 12.4, iLow: 101, iHigh: 150 },
    { cLow: 12.5, cHigh: 15.4, iLow: 151, iHigh: 200 },
    { cLow: 15.5, cHigh: 30.4, iLow: 201, iHigh: 300 },
    { cLow: 30.5, cHigh: 40.4, iLow: 301, iHigh: 400 },
    { cLow: 40.5, cHigh: 50.4, iLow: 401, iHigh: 500 }
  ];

  for (const bp of breakpoints) {
    if (co >= bp.cLow && co <= bp.cHigh) {
      return Math.round(((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (co - bp.cLow) + bp.iLow);
    }
  }
  
  return co > 50.4 ? 500 : null;
}

// Hàm tính AQI tổng hợp
function calculateOverallAQI(measurements) {
  const aqiValues = [];
  
  const pollutants = {
    pm25: measurements?.pm25?.value,
    pm10: measurements?.pm10?.value,
    o3: measurements?.o3?.value,
    no2: measurements?.no2?.value,
    so2: measurements?.so2?.value,
    co: measurements?.co?.value
  };

  const calculators = {
    pm25: calculatePM25AQI,
    pm10: calculatePM10AQI,
    o3: calculateO3AQI,
    no2: calculateNO2AQI,
    so2: calculateSO2AQI,
    co: calculateCOAQI
  };

  for (const [pollutant, value] of Object.entries(pollutants)) {
    if (value != null) {
      const aqi = calculators[pollutant](value);
      if (aqi != null) aqiValues.push({ aqi, pollutant });
    }
  }

  if (aqiValues.length === 0) return { aqius: null, mainus: null };
  
  aqiValues.sort((a, b) => b.aqi - a.aqi);
  return {
    aqius: aqiValues[0].aqi,
    mainus: aqiValues[0].pollutant
  };
}

// Hàm chuyển đổi sang định dạng district
function convertToDistrictReading(airHourData, districtInfo, isHCMC = false, hcmcAQI = null) {
  const { aqius, mainus } = calculateOverallAQI(airHourData.measurements);
  
  // Nếu không phải HCMC, random AQI dựa trên AQI của HCMC ±12
  let finalAQI = aqius;
  if (!isHCMC && hcmcAQI != null) {
    const offset = (Math.random() * 2 - 1) * 12; // Random từ -12 đến +12
    finalAQI = Math.round(Math.max(0, hcmcAQI + offset)); // Dựa trên AQI HCMC
  }
  
  const fakeWeather = {
    ts: airHourData.from,
    tp: parseFloat((28 + Math.random() * 5).toFixed(1)),
    hu: parseFloat((60 + Math.random() * 20).toFixed(1)),
    pr: parseFloat((1010 + Math.random() * 10).toFixed(1)),
    ws: parseFloat((2 + Math.random() * 3).toFixed(1)),
    wd: Math.floor(Math.random() * 360)
  };

  return {
    city: districtInfo.city,
    state: districtInfo.state,
    country: districtInfo.country,
    location: {
      type: 'Point',
      coordinates: districtInfo.coordinates
    },
    current: {
      pollution: {
        ts: airHourData.from,
        aqius: finalAQI,
        mainus: mainus,
        aqicn: null,
        maincn: null
      },
      weather: fakeWeather
    }
  };
}

// Danh sách các quận
const districtsList = [
  { model: models.HCMCReading, city: 'Ho Chi Minh City', state: 'Ho Chi Minh City', country: 'Vietnam', coordinates: [106.6297, 10.8231] },
  { model: models.District1Reading, city: 'Quận 1', state: 'Ho Chi Minh City', country: 'Vietnam', coordinates: [106.7009, 10.7756] },
  { model: models.District2Reading, city: 'Quận 2', state: 'Ho Chi Minh City', country: 'Vietnam', coordinates: [106.7425, 10.7915] },
  { model: models.District3Reading, city: 'Quận 3', state: 'Ho Chi Minh City', country: 'Vietnam', coordinates: [106.6828, 10.7829] },
  { model: models.District4Reading, city: 'Quận 4', state: 'Ho Chi Minh City', country: 'Vietnam', coordinates: [106.7025, 10.7543] },
  { model: models.District5Reading, city: 'Quận 5', state: 'Ho Chi Minh City', country: 'Vietnam', coordinates: [106.6508, 10.7544] },
  { model: models.District6Reading, city: 'Quận 6', state: 'Ho Chi Minh City', country: 'Vietnam', coordinates: [106.6347, 10.7490] },
  { model: models.District7Reading, city: 'Quận 7', state: 'Ho Chi Minh City', country: 'Vietnam', coordinates: [106.7197, 10.7335] },
  { model: models.District9Reading, city: 'Quận 9', state: 'Ho Chi Minh City', country: 'Vietnam', coordinates: [106.8047, 10.8502] },
  { model: models.District10Reading, city: 'Quận 10', state: 'Ho Chi Minh City', country: 'Vietnam', coordinates: [106.6684, 10.7733] },
  { model: models.District11Reading, city: 'Quận 11', state: 'Ho Chi Minh City', country: 'Vietnam', coordinates: [106.6509, 10.7626] },
  { model: models.BinhTanReading, city: 'Quận Bình Tân', state: 'Ho Chi Minh City', country: 'Vietnam', coordinates: [106.6053, 10.7400] },
  { model: models.PhuNhuanReading, city: 'Quận Phú Nhuận', state: 'Ho Chi Minh City', country: 'Vietnam', coordinates: [106.6780, 10.7980] },
  { model: models.BinhThanhReading, city: 'Quận Bình Thạnh', state: 'Ho Chi Minh City', country: 'Vietnam', coordinates: [106.7123, 10.8058] },
  { model: models.ThuDucReading, city: 'Thủ Đức', state: 'Ho Chi Minh City', country: 'Vietnam', coordinates: [106.7675, 10.8509] }
];

// Hàm sync realtime
async function syncRealtimeData() {
  try {
    // Lấy record mới nhất từ hcmc_air_hours
    const latestRecord = await HCMCAirHour.findOne()
      .sort({ from: -1 })
      .limit(1);

    if (!latestRecord) {
      console.log('[Sync] No data found in hcmc_air_hours');
      return;
    }

    // Kiểm tra xem đã sync record này chưa bằng cách check trong database HCMC
    const existingRecord = await models.HCMCReading.findOne({
      'current.pollution.ts': latestRecord.from
    });

    if (existingRecord) {
      console.log(`[Sync] Already synced: ${latestRecord.from.toISOString()}`);
      return;
    }

    console.log(`\n[Sync] New data detected: ${latestRecord.from.toISOString()}`);
    
    // Tính AQI gốc của HCMC trước
    const { aqius: hcmcAQI } = calculateOverallAQI(latestRecord.measurements);
    
    let successCount = 0;
    let errorCount = 0;

    // Sync vào tất cả các quận
    for (const district of districtsList) {
      try {
        // Kiểm tra xem có phải HCMC không
        const isHCMC = district.city === 'Ho Chi Minh City';
        const reading = convertToDistrictReading(latestRecord, district, isHCMC, hcmcAQI);
        
        // Upsert (update nếu có, insert nếu chưa có)
        await district.model.updateOne(
          { 'current.pollution.ts': latestRecord.from },
          { $set: reading },
          { upsert: true }
        );
        
        successCount++;
      } catch (err) {
        console.error(`[Sync] Error saving to ${district.city}:`, err.message);
        errorCount++;
      }
    }

    console.log(`[Sync] ✅ Success: ${successCount} districts, ❌ Errors: ${errorCount}`);
    console.log(`[Sync] AQI: ${hcmcAQI || 'N/A'}\n`);

  } catch (error) {
    console.error('[Sync] Error:', error.message);
  }
}

// Khởi tạo: Sync 72 giờ gần nhất khi start
async function initialSync() {
  try {
    console.log('\n🔄 [Initial Sync] Starting...\n');

    const airHourRecords = await HCMCAirHour.find()
      .sort({ from: -1 })
      .limit(72);

    if (!airHourRecords || airHourRecords.length === 0) {
      console.log('[Initial Sync] No data found');
      return;
    }

    console.log(`[Initial Sync] Processing ${airHourRecords.length} records...`);
    
    let totalSaved = 0;

    for (const airHour of airHourRecords) {
      // Tính AQI gốc của HCMC cho thời điểm này
      const { aqius: hcmcAQI } = calculateOverallAQI(airHour.measurements);
      
      for (const district of districtsList) {
        try {
          // Kiểm tra xem có phải HCMC không
          const isHCMC = district.city === 'Ho Chi Minh City';
          const reading = convertToDistrictReading(airHour, district, isHCMC, hcmcAQI);
          
          await district.model.updateOne(
            { 'current.pollution.ts': airHour.from },
            { $set: reading },
            { upsert: true }
          );
          
          totalSaved++;
        } catch (err) {
          // Silent error during initial sync
        }
            if (USE_ORION && latestData) {
      try {
        const districtKey = getDistrictKey(district.city);
        await orionSync.syncAQIReading(latestData, districtKey);
      } catch (err) {
        console.error(`[Orion-LD] Failed to sync ${district.city}:`, err.message);
      }
    }
      }
    }

    console.log(`[Initial Sync] ✅ Completed! Synced ${totalSaved} records\n`);

  } catch (error) {
    console.error('[Initial Sync] Error:', error.message);
  }
}

// Export functions
module.exports = {
  syncRealtimeData,
  initialSync
};
