const models = require('../../models');
// [GET] /
module.exports.index = async (req, res) => {
    try {
        const latestCity = await models.HCMCReading
            .findOne()
            .sort({ 'current.pollution.ts': -1 })
            .lean();

        const reading = latestCity ? {
            ts: latestCity.current?.pollution?.ts,
            aqius: latestCity.current?.pollution?.aqius,
            tp: latestCity.current?.weather?.tp,
            hu: latestCity.current?.weather?.hu,
            ws: latestCity.current?.weather?.ws
        } : null;

        res.render('client/pages/home/index', { title: null, reading });
    } catch (e) {
        res.render('client/pages/home/index', { title: null, reading: null });
    }
}
// [GET] /about
module.exports.about = (req, res) => {
    res.render('client/pages/home/about', { title: 'About Us' });
}
