const mongoose = require('mongoose');
const generate = require('../helpers/generate');

const otpSchema = new mongoose.Schema({
    email: String,
    otp: String,
    expiresAt:{
        type: Date,
        expires: 300, // 5 minutes
    }
    
},{
    timestamps: true
})

const OTP = mongoose.model('OTP', otpSchema , 'otp')

module.exports = OTP;