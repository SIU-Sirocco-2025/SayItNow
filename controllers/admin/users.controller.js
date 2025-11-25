const User = require('../../models/user.model');

async function index(req, res) {
  try {
    const users = await User.find({}).lean().exec();
    res.render('admin/pages/users/index', {
      title: 'Quản lý người dùng',
      users,
      prefixAdmin: req.app.locals.prefixAdmin,
      request: req
    });
  } catch (err) {
    req.flash('error', 'Lỗi khi load danh sách user');
    res.redirect(req.app.locals.prefixAdmin + '/dashboard');
  }
}

async function create(req, res) {
  try {
    const { username, email, password, role } = req.body;
    const user = new User({ username, email, password, role });
    await user.save();
    req.flash('success', 'Tạo user thành công');
    res.redirect(req.app.locals.prefixAdmin + '/users');
  } catch (err) {
    req.flash('error', 'Không thể tạo user: ' + (err.message || ''));
    res.redirect(req.app.locals.prefixAdmin + '/users');
  }
}

async function remove(req, res) {
  try {
    const id = req.params.id;
    await User.findByIdAndDelete(id).exec();
    req.flash('success', 'Xoá user thành công');
    res.redirect(req.app.locals.prefixAdmin + '/users');
  } catch (err) {
    req.flash('error', 'Không thể xoá user');
    res.redirect(req.app.locals.prefixAdmin + '/users');
  }
}

module.exports = {
  index,
  create,
  remove
};
