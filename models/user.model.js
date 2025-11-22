const mongoose = require('mongoose');
const generate = require('../helpers/generate');

const userSchema = new mongoose.Schema({
    fullName: String,
    email: String,
    password: String,
    tokenUser: {
        type: String,
        default: generate.generaterandomString(32)
    },
    apiKey: {
        type: String,
        default: generate.generaterandomString(64)
    },
    avatar: String,
    status: {
        type: String,
        default: 'active'
    },
    deleted: {
        type : Boolean,
        default: false
    },
    deletedAt: Date,
},{
    timestamps: true
})

const User = mongoose.model('User', userSchema , 'users')

module.exports = User;