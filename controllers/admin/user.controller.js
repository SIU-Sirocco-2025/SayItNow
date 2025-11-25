const User = require('../../models/user.model');
const md5 = require('md5');

async function index(req, res) {
  try {
    res.render('admin/pages/user/index', {
      title: 'Quản lý người dùng',
    });
  } catch (err) {
    res.status(500).send('User page render error');
  }
}

async function getList(req, res) {
  try {
    const users = await User.find({}, '-password').lean().exec();
    res.json({ success: true, users });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function create(req, res) {
  try {
    const { username, email, password, role } = req.body;
    
    if (!username || !email || !password) {
      return res.json({ success: false, message: 'Username, email và password bắt buộc' });
    }

    const existUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existUser) {
      return res.json({ success: false, message: 'Email hoặc username đã tồn tại' });
    }

    const user = new User({ 
      username, 
      email, 
      password: md5(password),
      role: role || 'user'
    });
    await user.save();
    
    res.json({ success: true, message: 'Tạo user thành công', user });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function update(req, res) {
  try {
    const { id } = req.params;
    const { username, email, role } = req.body;
    
    const user = await User.findByIdAndUpdate(
      id,
      { username, email, role },
      { new: true }
    ).lean().exec();

    if (!user) {
      return res.json({ success: false, message: 'User không tồn tại' });
    }

    res.json({ success: true, message: 'Cập nhật thành công', user });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function remove(req, res) {
  try {
    const { id } = req.params;
    
    const user = await User.findByIdAndRemove(id).lean().exec();
    if (!user) {
      return res.json({ success: false, message: 'User không tồn tại' });
    }

    res.json({ success: true, message: 'Xóa user thành công' });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

module.exports = {
  index,
  getList,
  create,
  update,
  remove
};
