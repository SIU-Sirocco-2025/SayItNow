const mongoose = require('mongoose');
require('dotenv').config();

module.exports.connect = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('Database connected successfully');
  } catch (error){
    console.error('Database connection failed:', error);
  }
}
