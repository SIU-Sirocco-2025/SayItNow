const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['bug', 'feature', 'question', 'other'],
        default: 'question'
    },
    message: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'resolved', 'closed'],
        default: 'pending'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    adminNote: {
        type: String,
        default: ''
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    deleted: {
        type: Boolean,
        default: false
    },
    deletedAt: Date
}, {
    timestamps: true
});

const Ticket = mongoose.model('Ticket', ticketSchema, 'tickets');

module.exports = Ticket;