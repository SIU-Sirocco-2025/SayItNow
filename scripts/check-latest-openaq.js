// © 2025 SIU_Sirocco – Phát hành theo GPL-3.0
// This file is part of Eco-Track.
// Eco-Track is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License.
// Eco-Track is distributed WITHOUT ANY WARRANTY; see LICENSE for details.
// See LICENSE in the project root for full license text.

const mongoose = require('mongoose');
require('dotenv').config();
const HCMCAirHour = require('../models/hcmcAirHour.model');

async function checkLatestData() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('✅ Connected to database\n');

    // Lấy 10 record mới nhất
    const latestRecords = await HCMCAirHour.find()
      .sort({ to: -1 })
      .limit(10)
      .select('to measurements.pm25.value');

    console.log('📊 Latest 10 records in hcmc_air_hours:\n');
    latestRecords.forEach((record, index) => {
      const date = new Date(record.to);
      const pm25 = record.measurements?.pm25?.value || 'N/A';
      console.log(`${index + 1}. ${date.toISOString()} (PM2.5: ${pm25})`);
    });

    // Kiểm tra có dữ liệu ngày 28 không
    const nov28Records = await HCMCAirHour.countDocuments({
      to: {
        $gte: new Date('2025-11-28T00:00:00Z'),
        $lt: new Date('2025-11-29T00:00:00Z')
      }
    });

    console.log(`\n📅 Records for November 28, 2025: ${nov28Records}`);

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkLatestData();
