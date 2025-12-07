// © 2025 SIU_Sirocco – Phát hành theo GPL-3.0
// This file is part of Eco-Track.
// Eco-Track is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License.
// Eco-Track is distributed WITHOUT ANY WARRANTY; see LICENSE for details.
// See LICENSE in the project root for full license text.
const mongoose = require('mongoose');
require('dotenv').config();

module.exports.connect = async () => {
  try {
    if (!process.env.MONGODB_URL) {
      console.warn('⚠️  Database URL missing (MONGODB_URL). Skipping DB connection. Features depending on DB may not work.');
      return;
    }
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('Database connected successfully');
  } catch (error){
    console.error('⚠️  Database connection failed:', error.message);
  }
}
