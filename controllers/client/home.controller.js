// [GET] /
module.exports.index = (req, res) => {
    res.render('client/pages/home/index', { title: 'Home Page' });
}
// [GET] /about
module.exports.about = (req, res) => {
    res.render('client/pages/home/about', { title: 'About Us' });
}
