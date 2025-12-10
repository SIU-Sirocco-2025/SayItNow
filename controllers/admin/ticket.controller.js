// © 2025 SIU_Sirocco – Phát hành theo GPL-3.0
// This file is part of Eco-Track.
// Eco-Track is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License.
// Eco-Track is distributed WITHOUT ANY WARRANTY; see LICENSE for details.
// See LICENSE in the project root for full license text.
const Ticket = require('../../models/ticket.model');

// [GET] /admin/tickets - Danh sách tất cả tickets
module.exports.index = async (req, res) => {
    try {
        const { status, category, priority } = req.query;
        
        const filter = { deleted: false };
        if (status) filter.status = status;
        if (category) filter.category = category;
        if (priority) filter.priority = priority;

        const tickets = await Ticket
            .find(filter)
            .sort({ createdAt: -1 })
            .lean();

        res.render('admin/pages/ticket/index', {
            title: 'Quản lý phản hồi',
            tickets,
            currentStatus: status || 'all',
            currentCategory: category || 'all',
            currentPriority: priority || 'all'
        });
    } catch (err) {
        console.error('Ticket index error:', err);
        req.flash('error', 'Không thể tải danh sách phản hồi');
        res.redirect(req.app.locals.prefixAdmin + '/dashboard');
    }
};

// [GET] /admin/tickets/:id - Chi tiết ticket
module.exports.detail = async (req, res) => {
    try {
        const ticket = await Ticket
            .findById(req.params.id)
            .populate('userId', 'fullName email')
            .lean();

        if (!ticket) {
            req.flash('error', 'Không tìm thấy phản hồi');
            return res.redirect(req.app.locals.prefixAdmin + '/tickets');
        }

        res.render('admin/pages/ticket/detail', {
            title: 'Chi tiết phản hồi',
            ticket
        });
    } catch (err) {
        console.error('Ticket detail error:', err);
        req.flash('error', 'Không thể tải chi tiết phản hồi');
        res.redirect(req.app.locals.prefixAdmin + '/tickets');
    }
};

// [PATCH] /admin/tickets/:id/status - Cập nhật trạng thái
module.exports.updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        
        if (!['pending', 'in-progress', 'resolved', 'closed'].includes(status)) {
            req.flash('error', 'Trạng thái không hợp lệ');
            return res.redirect(req.get('Referrer') || `${req.app.locals.prefixAdmin}/dashboard`);
        }

        await Ticket.findByIdAndUpdate(req.params.id, { status });
        
        req.flash('success', 'Cập nhật trạng thái thành công');
        res.redirect(req.get('Referrer') || `${req.app.locals.prefixAdmin}/dashboard`);
    } catch (err) {
        console.error('Update status error:', err);
        req.flash('error', 'Không thể cập nhật trạng thái');
        res.redirect(req.get('Referrer') || `${req.app.locals.prefixAdmin}/dashboard`);
    }
};

// [PATCH] /admin/tickets/:id/priority - Cập nhật độ ưu tiên
module.exports.updatePriority = async (req, res) => {
    try {
        const { priority } = req.body;
        
        if (!['low', 'medium', 'high', 'urgent'].includes(priority)) {
            req.flash('error', 'Độ ưu tiên không hợp lệ');
            return res.redirect(req.get('Referrer') || `${req.app.locals.prefixAdmin}/dashboard`);
        }

        await Ticket.findByIdAndUpdate(req.params.id, { priority });
        
        req.flash('success', 'Cập nhật độ ưu tiên thành công');
        res.redirect(req.get('Referrer') || `${req.app.locals.prefixAdmin}/dashboard`);
    } catch (err) {
        console.error('Update priority error:', err);
        req.flash('error', 'Không thể cập nhật độ ưu tiên');
        res.redirect(req.get('Referrer') || `${req.app.locals.prefixAdmin}/dashboard`);
    }
};

// [PATCH] /admin/tickets/:id/note - Thêm ghi chú admin
module.exports.updateNote = async (req, res) => {
    try {
        const { adminNote } = req.body;

        await Ticket.findByIdAndUpdate(req.params.id, { adminNote });
        
        req.flash('success', 'Cập nhật ghi chú thành công');
        res.redirect(req.get('Referrer') || `${req.app.locals.prefixAdmin}/dashboard`);
    } catch (err) {
        console.error('Update note error:', err);
        req.flash('error', 'Không thể cập nhật ghi chú');
        res.redirect(req.get('Referrer') || `${req.app.locals.prefixAdmin}/dashboard`);
    }
};

// [DELETE] /admin/tickets/:id - Xóa ticket
module.exports.delete = async (req, res) => {
    try {
        await Ticket.findByIdAndUpdate(req.params.id, {
            deleted: true,
            deletedAt: new Date()
        });

        req.flash('success', 'Xóa phản hồi thành công');
        res.redirect(req.app.locals.prefixAdmin + '/tickets');
    } catch (err) {
        console.error('Delete ticket error:', err);
        req.flash('error', 'Không thể xóa phản hồi');
        res.redirect(req.get('Referrer') || `${req.app.locals.prefixAdmin}/dashboard`);
    }
};

// [GET] /admin/tickets/api/stats - Thống kê tickets
module.exports.stats = async (req, res) => {
    try {
        const total = await Ticket.countDocuments({ deleted: false });
        const pending = await Ticket.countDocuments({ status: 'pending', deleted: false });
        const inProgress = await Ticket.countDocuments({ status: 'in-progress', deleted: false });
        const resolved = await Ticket.countDocuments({ status: 'resolved', deleted: false });
        const closed = await Ticket.countDocuments({ status: 'closed', deleted: false });

        const byCategory = await Ticket.aggregate([
            { $match: { deleted: false } },
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);

        const byPriority = await Ticket.aggregate([
            { $match: { deleted: false } },
            { $group: { _id: '$priority', count: { $sum: 1 } } }
        ]);

        res.json({
            success: true,
            stats: {
                total,
                byStatus: { pending, inProgress, resolved, closed },
                byCategory: byCategory.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {}),
                byPriority: byPriority.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {})
            }
        });
    } catch (err) {
        console.error('Stats error:', err);
        res.json({ success: false, message: err.message });
    }
};