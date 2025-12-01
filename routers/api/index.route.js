// © 2025 SIU_Sirocco – Phát hành theo GPL-3.0
// This file is part of Eco-Track.
// Eco-Track is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License.
// Eco-Track is distributed WITHOUT ANY WARRANTY; see LICENSE for details.
// See LICENSE in the project root for full license text.
const predictionRoute = require('./prediction.route');
const ngsiLdRoute = require('./ngsiLd.route');

module.exports = (app) => {
  const API_PREFIX = app.locals.prefixApi || '/api';
  app.use(API_PREFIX + '/prediction', predictionRoute);
  app.use(API_PREFIX + '/ngsi-ld', ngsiLdRoute);
};