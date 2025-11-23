// [GET] /api/docs
module.exports.index = async (req, res) => {
  try {
    res.render('client/pages/docs/index', { 
      title: 'API Documentation - Eco-Track',
      pageTitle: 'API Documentation'
    });
  } catch (e) {
    console.error('Docs error:', e);
    res.status(500).send('Failed to render documentation');
  }
};
