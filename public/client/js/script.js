// Enhanced client-side AQI map + UI behaviours
(function initAQIMap() {
  function aqiClass(aqius) {
    if (aqius <= 50) return { key: 'good', color: '#2ecc71', label: 'Tot' };
    if (aqius <= 100) return { key: 'moderate', color: '#f1c40f', label: 'Trung binh' };
    if (aqius <= 150) return { key: 'unhealthy', color: '#e67e22', label: 'Nhay cam' };
    if (aqius <= 200) return { key: 'unhealthy', color: '#e67e22', label: 'Xau' };
    if (aqius <= 300) return { key: 'very-unhealthy', color: '#8e44ad', label: 'Rat xau' };
    return { key: 'hazardous', color: '#e74c3c', label: 'Nguy hai' };
  }
  function formatTime(value) {
    if (!value) return '--';
    const time = typeof value === 'number' ? new Date(value) : new Date(String(value));
    if (Number.isNaN(time.getTime())) return '--';
    return time.toLocaleString('vi-VN', { hour12: false });
  }
  function updateHeaderBadges(aqi, temp, ts) {
    const root = document.querySelector('.aqi-badge');
    const valueEl = document.querySelector('[data-aqi]');
    if (!root || !valueEl) return;
    const info = aqiClass(Number(aqi || 0));
    valueEl.textContent = aqi ?? '--';
    root.classList.remove(
      'aqi-good', 'aqi-moderate', 'aqi-unhealthy', 'aqi-very-unhealthy', 'aqi-hazardous', 'aqi-unknown'
    );
    root.classList.add(`aqi-${info.key}`);
    root.title = `Cap nhat: ${formatTime(ts)} • ${info.label}`;
  }

  // Cập nhật header luôn, dù có hay không có map
  fetch('/aqi/latest-reading')
    .then(r => r.json())
    .then(d => { if (d?.success) updateHeaderBadges(d.aqius, d.tp, d.ts); })
    .catch(() => { });

  // Kiểm tra map
  const mapEl = document.getElementById('aqi-map');
  if (!mapEl || typeof L === 'undefined') {
    // Không có map -> dừng sau khi đã cập nhật header
    return;
  }

  const HCMC_BOUNDS = L.latLngBounds([10.40, 106.40], [10.97, 107.10]);
  const baseLayers = {
    'Carto Light': L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }),
    'Dark Matter': L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }),
    'OpenStreetMap': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    })
  };

  let currentBaseLayer = baseLayers['Carto Light'];
  const map = L.map('aqi-map', {
    zoomControl: true,
    layers: [currentBaseLayer],
    maxBounds: HCMC_BOUNDS.pad(0.02),
    maxBoundsViscosity: 0.8
  });
  map.fitBounds(HCMC_BOUNDS);
  const layerControl = L.control.layers(baseLayers, null, { position: 'topleft', collapsed: true }).addTo(map);
  map.on('baselayerchange', e => highlightBaseButtons(e.name));

  const markerLayer = L.layerGroup().addTo(map);
  let heatLayer = null;
  let userMarker = null;
  const markerById = new Map();
  const layerState = { heat: true, markers: true };

  // Visual outline for the focus area
  L.rectangle(HCMC_BOUNDS, { color: '#f39c12', weight: 1, fill: false, dashArray: '6 4' }).addTo(map);

  // DOM references
  const layerButtons = document.querySelectorAll('[data-layer-toggle]');
  const styleButtons = document.querySelectorAll('[data-map-style]');
  const locateBtn = document.querySelector('[data-map-action="locate"]');
  const stationContainer = document.getElementById('aqi-stations');
  const stationsUpdatedEl = document.querySelector('[data-stations-updated]');
  const cityHeroEl = document.getElementById('aqi-city-hero');

  let cityOverlay = null;

  const adviceTexts = {
    good: 'Khong khi an toan, ban co the sinh hoat ngoai troi binh thuong.',
    moderate: 'Nguoi nhay cam nen giam thoi gian ngoai troi, nguoi khac van on.',
    unhealthy: 'Can than trong: giam hoat dong manh va nen deo khau trang phu hop.',
    'very-unhealthy': 'Han che ra ngoai neu khong can thiet, uu tien o trong nha.',
    hazardous: 'Muc nguy hiem: nen o trong nha va su dung thiet bi loc khong khi neu co.'
  };

  function isCityWideStation(feature) {
    const props = feature?.properties || {};
    const key = String(props.cityKey || props.city || '').toLowerCase();
    return key.includes('hochiminh') || key.includes('ho chi minh');
  }

  function splitStations(features) {
    let cityStation = null;
    const districts = [];
    (features || []).forEach(f => {
      if (!cityStation && isCityWideStation(f)) cityStation = f;
      else districts.push(f);
    });
    return { cityStation, districts };
  }

  // function aqiClass(aqius) {
  //   if (aqius <= 50) return { key: 'good', color: '#2ecc71', label: 'Tot' };
  //   if (aqius <= 100) return { key: 'moderate', color: '#f1c40f', label: 'Trung binh' };
  //   if (aqius <= 150) return { key: 'unhealthy', color: '#e67e22', label: 'Nhay cam' };
  //   if (aqius <= 200) return { key: 'unhealthy', color: '#e67e22', label: 'Xau' };
  //   if (aqius <= 300) return { key: 'very-unhealthy', color: '#8e44ad', label: 'Rat xau' };
  //   return { key: 'hazardous', color: '#e74c3c', label: 'Nguy hai' };
  // }

  // function formatTime(value) {
  //   if (!value) return '--';
  //   const time = typeof value === 'number' ? new Date(value) : new Date(String(value));
  //   if (Number.isNaN(time.getTime())) return '--';
  //   return time.toLocaleString('vi-VN', { hour12: false });
  // }
  // function updateHeaderBadges(aqi, temp, ts) {
  //   const aqiEl = document.querySelector('.aqi-badge');
  //   const tempEl = document.querySelector('[data-temp]');
  //   if (!aqiEl || !tempEl) return;
  //   const info = aqiClass(Number(aqi || 0));
  //   aqiEl.dataset.aqi = aqi ?? '--';
  //   aqiEl.innerHTML = `<i class="bi bi-wind me-1"></i>AQI ${aqi ?? '--'}`;
  //   aqiEl.className = `aqi-badge btn btn-outline-light rounded-pill aqi-${info.key}`;
  //   tempEl.innerHTML = `<i class="bi bi-thermometer me-1"></i>${typeof temp === 'number' ? temp + '°' : '--°'}`;
  //   aqiEl.title = `Cap nhat: ${formatTime(ts)} • ${info.label}`;
  // }

  // // Luôn gọi để cập nhật header, kể cả khi không có map
  // fetch('/aqi/latest-reading')
  //   .then(r => r.json())
  //   .then(d => { if (d?.success) updateHeaderBadges(d.aqius, d.tp, d.ts); })
  //   .catch(() => { });

  // const mapEl = document.getElementById('aqi-map');
  // const hasMap = mapEl && typeof L !== 'undefined';
  // if (!hasMap) {
  //   // Không có map -> chỉ cần header, dừng tại đây
  //   return;
  // }

  function renderCityHero(station) {
    if (!cityHeroEl) return;
    if (!station) {
      cityHeroEl.innerHTML = '';
      cityHeroEl.classList.add('d-none');
      return;
    }
    cityHeroEl.classList.remove('d-none');
    const props = station.properties || {};
    const aqius = Number(props.aqius || 0) || '--';
    const info = aqiClass(aqius);
    const tsText = props.ts ? formatTime(props.ts) : '--';
    const label = props.city || 'Ho Chi Minh City';
    const key = props.cityKey || 'city-wide';
    cityHeroEl.innerHTML = `
      <div class="aqi-city-hero-card card aqi-card-${info.key}" data-station-id="${key}">
        <div class="card-body d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
          <div class="flex-grow-1">
            <p class="text-uppercase small fw-semibold text-muted mb-1">
              <i class="bi bi-broadcast-pin me-1"></i>Tram tong
            </p>
            <h3 class="h4 mb-1">${label}</h3>
            <p class="mb-2 text-muted d-flex align-items-center gap-2">
              <i class="bi bi-geo me-1"></i>Phu song toan thanh pho
            </p>
            <span class="aqi-city-chip me-2 badge rounded-pill px-3 py-2" style="background:${info.color}1f;color:${info.color};border:1px solid ${info.color}33">${info.label}</span>
            <button type="button" class="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1" data-city-hour-btn>
              <i class="bi bi-clock-history"></i>
              <span>Thong so gio gan nhat</span>
            </button>
          </div>
          <div class="text-center">
            <div class="display-4 fw-bold mb-0">${aqius}</div>
            <div class="text-muted">AQI</div>
            <div class="mt-2 small text-muted d-flex align-items-center justify-content-center gap-1">
              <i class="bi bi-arrow-repeat"></i><span>Cap nhat: ${tsText}</span>
            </div>
          </div>
        </div>
      </div>`;
    cityHeroEl.querySelector('[data-station-id]').addEventListener('click', () => focusStation(key));
    const btn = cityHeroEl.querySelector('[data-city-hour-btn]');
    btn.addEventListener('click', e => {
      e.stopPropagation();
      toggleCityHourDetails();
    });
  }
  function renderCityHourDetails(data) {
    const wrap = document.getElementById('city-hour-details');
    if (!wrap) return;
    if (!data?.success) {
      wrap.innerHTML = '<div class="city-hour-card small text-muted">Khong co du lieu gio gan nhat.</div>';
      wrap.classList.remove('d-none');
      return;
    }
    const win = data.window || {};
    const fromText = formatTime(win.fromLocal || win.from);
    const toText = formatTime(win.toLocal || win.to);

    // Mapping chuẩn
    const SENSOR_META = {
      pm1: { display: 'PM1.0', unit: 'µg/m³', icon: 'bi-bullseye', critical: true },
      pm25: { display: 'PM2.5', unit: 'µg/m³', icon: 'bi-cloud-haze2', critical: true },
      relativehumidity: { display: 'Độ ẩm', unit: '%', icon: 'bi-droplet-half' },
      temperature: { display: 'Nhiệt độ', unit: '°C', icon: 'bi-thermometer-half' },
      um003: { display: 'PM0.3', unit: 'particles/cm³', icon: 'bi-stars' }
    };
    const sensorMeta = k => SENSOR_META[k] || { display: k, unit: '', icon: 'bi-info-circle' };
    const orderWeight = k => ({ pm1: 1, pm25: 2, relativehumidity: 3, temperature: 4, um003: 5 }[k] || 99);

    const rows = (data.measurements || [])
      .sort((a, b) => orderWeight(a.key) - orderWeight(b.key))
      .map(m => {
        const meta = sensorMeta(m.key);
        const warn = meta.critical;
        return `
        <tr class="${warn ? 'table-warning' : ''}">
          <td class="text-muted">
            <i class="bi ${meta.icon} me-1"></i>${meta.display}
          </td>
          <td>
            <span class="fw-semibold">${m.value ?? '--'}</span>
            ${warn ? '<span class="badge bg-danger-subtle text-danger ms-2">Canh bao</span>' : ''}
          </td>
          <td class="text-muted">${meta.unit}</td>
        </tr>`;
      }).join('');

    wrap.innerHTML = `
    <div class="city-hour-card card border-0 shadow-sm">
      <div class="card-header bg-white border-0 pb-0 d-flex justify-content-between align-items-center">
        <h5 class="h6 mb-0 d-flex align-items-center gap-2">
          <i class="bi bi-clock-history text-primary"></i><span>Thong so gio gan nhat</span>
        </h5>
        <button type="button" class="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1" data-city-hour-close>
          <i class="bi bi-x-lg"></i><span>Dong</span>
        </button>
      </div>
      <div class="card-body pt-2">
        <p class="small text-muted mb-3">
          <i class="bi bi-calendar-range me-1"></i>
          Khung gio: <strong>${fromText}</strong>
          <span class="mx-1">→</span>
          <strong>${toText}</strong>
        </p>
        <div class="row g-3 mb-3 city-hour-metrics">
          ${(data.measurements || []).sort((a, b) => orderWeight(a.key) - orderWeight(b.key)).map(m => {
      const meta = sensorMeta(m.key);
      const cls = meta.critical ? 'metric-item danger' : 'metric-item';
      return `
              <div class="col-6 col-md-4 col-lg-3">
                <div class="${cls}">
                  <div class="metric-label text-muted small">
                    <i class="bi ${meta.icon} me-1"></i>${meta.display}
                  </div>
                  <div class="metric-value fw-semibold">${m.value ?? '--'} <span class="small text-muted">${meta.unit}</span></div>
                </div>
              </div>`;
    }).join('')}
        </div>
        <div class="table-responsive mb-0 city-hour-table">
          <table class="table table-sm align-middle mb-0">
            <thead class="table-light">
              <tr><th>Sensor</th><th>Value</th><th>Unit</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    </div>`;
    wrap.classList.remove('d-none');
    wrap.querySelector('[data-city-hour-close]').addEventListener('click', () => wrap.classList.add('d-none'));
  }

  let cityHourLoaded = false;
  function toggleCityHourDetails() {
    const wrap = document.getElementById('city-hour-details');
    if (!wrap) return;
    if (!wrap.classList.contains('d-none')) {
      wrap.classList.add('d-none');
      return;
    }
    if (!cityHourLoaded) {
      fetch('/aqi/hour-latest')
        .then(r => r.json())
        .then(data => {
          cityHourLoaded = true;
          renderCityHourDetails(data);
        })
        .catch(() => {
          cityHourLoaded = true;
          renderCityHourDetails(null);
        });
    } else {
      wrap.classList.remove('d-none');
    }
  }

  function applyCityOverlay(station) {
    if (cityOverlay) {
      map.removeLayer(cityOverlay);
      cityOverlay = null;
    }
    if (!station) return;
    const aqius = Number(station.properties?.aqius || 0);
    const info = aqiClass(aqius);
    cityOverlay = L.rectangle(HCMC_BOUNDS, {
      color: info.color,
      weight: 0,
      fillColor: info.color,
      fillOpacity: 0.08,
      interactive: false
    }).addTo(map);
  }

  function createCityHeatPoints(station, bounds) {
    if (!station) return [];
    const aqius = Number(station.properties?.aqius || 0);
    const intensity = Math.max(0.08, Math.min(1, Math.pow(aqius / 400, 1.05)));
    const south = bounds.getSouth();
    const north = bounds.getNorth();
    const west = bounds.getWest();
    const east = bounds.getEast();
    const rows = 6;
    const cols = 6;
    const latStep = (north - south) / rows;
    const lngStep = (east - west) / cols;
    const points = [];
    for (let i = 0; i < rows; i++) {
      const lat = south + (i + 0.5) * latStep;
      for (let j = 0; j < cols; j++) {
        const lng = west + (j + 0.5) * lngStep;
        points.push([lat, lng, intensity]);
      }
    }
    return points;
  }

  function updateStatusbar(features) {
    const avgEl = document.getElementById('aqi-avg');
    const maxEl = document.getElementById('aqi-max');
    const minEl = document.getElementById('aqi-min');
    const status = document.getElementById('aqi-status-text');
    const sub = document.getElementById('aqi-status-sub');
    const wrap = document.querySelector('.aqi-statusbar');
    if (!features?.length || !wrap || !avgEl) return;
    const values = features.map(f => Number(f.properties?.aqius || 0));
    const avg = Math.round(values.reduce((acc, cur) => acc + cur, 0) / values.length);
    const mx = Math.max(...values);
    const mn = Math.min(...values);
    const cls = aqiClass(avg);
    avgEl.textContent = avg;
    maxEl.textContent = mx;
    minEl.textContent = mn;
    status.textContent = `Muc do hien tai: ${cls.label}`;
    sub.textContent = adviceTexts[cls.key] || adviceTexts.unhealthy;

    wrap.classList.remove('aqi-theme-good', 'aqi-theme-moderate', 'aqi-theme-unhealthy', 'aqi-theme-very-unhealthy', 'aqi-theme-hazardous');
    document.body.classList.remove('aqi-safe', 'aqi-danger');
    mapEl.classList.add('aqi-map-ring');
    if (cls.key === 'good' || cls.key === 'moderate') {
      document.body.classList.add('aqi-safe');
    } else {
      document.body.classList.add('aqi-danger');
    }
    wrap.classList.add(
      cls.key === 'good' ? 'aqi-theme-good' :
        cls.key === 'moderate' ? 'aqi-theme-moderate' :
          cls.key === 'unhealthy' ? 'aqi-theme-unhealthy' :
            cls.key === 'very-unhealthy' ? 'aqi-theme-very-unhealthy' : 'aqi-theme-hazardous'
    );
  }

  function renderHeatLayer(stations, cityStation) {
    if (!L.heatLayer) return;
    const heatData = (stations || []).map(f => {
      const [lng, lat] = f.geometry.coordinates || [];
      const aqius = Number(f.properties?.aqius || 0);
      const intensity = Math.max(0.08, Math.min(1, Math.pow(aqius / 350, 1.1)));
      return [lat, lng, intensity];
    }).filter(point => Number.isFinite(point[0]) && Number.isFinite(point[1]));
    if (heatLayer) map.removeLayer(heatLayer);
    heatLayer = L.heatLayer(heatData, {
      radius: 60,
      blur: 38,
      minOpacity: 0.45,
      maxZoom: 17,
      gradient: {
        0.0: '#2ecc71',
        0.35: '#f1c40f',
        0.6: '#e67e22',
        0.8: '#8e44ad',
        1.0: '#e74c3c'
      }
    });
    if (layerState.heat) heatLayer.addTo(map);
  }

  function renderMarkers(stations, cityStation) {
    markerLayer.clearLayers();
    markerById.clear();
    const list = [...(stations || [])];
    list.forEach((f, idx) => {
      const [lng, lat] = f.geometry.coordinates || [];
      const props = f.properties || {};
      const aqius = Number(props.aqius || 0);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      const info = aqiClass(aqius);
      const classes = [`pm-dot`, info.key.replace(/\s/g, '-'), aqius >= 151 ? 'need-pulse' : ''].join(' ').trim();
      const iconSize = [16, 16];
      const iconAnchor = [8, 8];
      const divIcon = L.divIcon({
        className: 'pm-icon',
        html: `<span class="${classes}" style="color:${info.color}"></span>`,
        iconSize,
        iconAnchor
      });
      const label = props.city || 'Tram';
      const marker = L.marker([lat, lng], { icon: divIcon })
        .bindTooltip(`<strong>${label}</strong><br/>AQI: ${aqius} (${info.label})`, { direction: 'top' });
      markerLayer.addLayer(marker);
      const key = props.cityKey || props.city || `station-${idx}`;
      markerById.set(key, marker);
    });
    if (!layerState.markers) map.removeLayer(markerLayer);
  }

  function renderStationCards(stations) {
    if (!stationContainer) return;
    stationContainer.innerHTML = '';
    const sorted = [...(stations || [])].sort((a, b) => (b.properties?.aqius || 0) - (a.properties?.aqius || 0));
    if (!sorted.length) {
      stationContainer.innerHTML = '<div class="col text-center text-muted py-4">Khong co du lieu AQI.</div>';
      return;
    }
    sorted.forEach((f, idx) => {
      const props = f.properties || {};
      const aqius = Number(props.aqius || 0) || '--';
      const info = aqiClass(aqius);
      const tsText = props.ts ? formatTime(props.ts) : '--';
      const col = document.createElement('div');
      col.className = 'col';
      const cardId = props.cityKey || props.city || `station-${idx}`;
      col.innerHTML = `
        <div class="aqi-station-card card aqi-card-${info.key}" data-station-id="${cardId}">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <div>
                <p class="text-muted small mb-0">${props.state || 'Ho Chi Minh'}</p>
                <h3 class="h6 mb-0">${props.city || 'Tram AQI'}</h3>
              </div>
              <span class="aqi-card-badge" style="background:${info.color}1f;color:${info.color}">${info.label}</span>
            </div>
            <div class="d-flex align-items-baseline gap-2 mb-2">
              <span class="display-6 fw-bold">${aqius}</span>
              <span class="text-muted">AQI</span>
            </div>
            <div class="aqi-station-meta">Cap nhat: ${tsText}</div>
          </div>
        </div>`;
      col.querySelector('.aqi-station-card').addEventListener('click', () => focusStation(cardId));
      stationContainer.appendChild(col);
    });
  }

  function focusStation(id) {
    const marker = markerById.get(id);
    if (!marker) return;
    const latlng = marker.getLatLng();
    map.flyTo(latlng, 13, { duration: 0.7 });
    setTimeout(() => marker.openTooltip(), 500);
  }

  function syncLayerState() {
    if (layerState.markers) {
      markerLayer.addTo(map);
    } else {
      map.removeLayer(markerLayer);
    }
    if (heatLayer) {
      if (layerState.heat) heatLayer.addTo(map);
      else map.removeLayer(heatLayer);
    }
  }

  function setBaseLayer(name) {
    if (!baseLayers[name] || baseLayers[name] === currentBaseLayer) return;
    map.removeLayer(currentBaseLayer);
    currentBaseLayer = baseLayers[name];
    currentBaseLayer.addTo(map);
    highlightBaseButtons(name);
  }

  function highlightBaseButtons(name) {
    styleButtons.forEach(btn => {
      const isActive = btn.dataset.mapStyle === name;
      btn.classList.toggle('active', isActive);
    });
  }

  function addLegendControl() {
    const legend = L.control({ position: 'bottomright' });
    legend.onAdd = function () {
      const div = L.DomUtil.create('div', 'card p-2 shadow-sm small');
      div.innerHTML = [
        '<div><strong>AQI</strong></div>',
        '<div><span style="display:inline-block;width:10px;height:10px;background:#2ecc71;margin-right:6px"></span>0-50 Tot</div>',
        '<div><span style="display:inline-block;width:10px;height:10px;background:#f1c40f;margin-right:6px"></span>51-100 Trung binh</div>',
        '<div><span style="display:inline-block;width:10px;height:10px;background:#e67e22;margin-right:6px"></span>101-200 Xau/Nhay cam</div>',
        '<div><span style="display:inline-block;width:10px;height:10px;background:#8e44ad;margin-right:6px"></span>201-300 Rat xau</div>',
        '<div><span style="display:inline-block;width:10px;height:10px;background:#e74c3c;margin-right:6px"></span>300+ Nguy hai</div>'
      ].join('');
      return div;
    };
    legend.addTo(map);
  }

  function handleLocate() {
    if (!navigator.geolocation) {
      alert('Trinh duyet khong ho tro dinh vi.');
      return;
    }
    locateBtn?.classList.add('disabled');
    navigator.geolocation.getCurrentPosition(
      pos => {
        locateBtn?.classList.remove('disabled');
        const latlng = [pos.coords.latitude, pos.coords.longitude];
        if (!userMarker) {
          userMarker = L.circleMarker(latlng, {
            radius: 8,
            color: '#3498db',
            fillColor: '#3498db',
            fillOpacity: 0.9
          }).bindTooltip('Vi tri cua ban', { direction: 'top' }).addTo(map);
        } else {
          userMarker.setLatLng(latlng);
        }
        map.flyTo(latlng, 13, { duration: 0.7 });
        userMarker.openTooltip();
      },
      () => locateBtn?.classList.remove('disabled'),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  // UI events
  layerButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.layerToggle;
      if (!key) return;
      btn.classList.toggle('active');
      layerState[key] = btn.classList.contains('active');
      syncLayerState();
    });
  });
  styleButtons.forEach(btn => {
    btn.addEventListener('click', () => setBaseLayer(btn.dataset.mapStyle));
  });
  locateBtn?.addEventListener('click', handleLocate);
  highlightBaseButtons('Carto Light');

  function updateStationsTimestamp(features) {
    if (!stationsUpdatedEl) return;
    const timestamps = (features || [])
      .map(f => Date.parse(f.properties?.ts))
      .filter(v => !Number.isNaN(v));
    if (!timestamps.length) {
      stationsUpdatedEl.textContent = '';
      return;
    }
    const latest = Math.max(...timestamps);
    stationsUpdatedEl.textContent = `Cap nhat luc ${formatTime(latest)}`;
  }

  fetch('/aqi/data')
    .then(r => r.json())
    .then(fc => {
      if (!fc || !Array.isArray(fc.features)) return;
      const { cityStation, districts } = splitStations(fc.features);
      updateStatusbar(fc.features);
      renderMarkers(districts, cityStation);
      renderHeatLayer(districts, cityStation);
      renderCityHero(cityStation);
      applyCityOverlay(cityStation);
      renderStationCards(districts);
      updateStationsTimestamp(fc.features);
      addLegendControl();
    })
    .catch(() => { });
})();


// Show Alert Message

const showAlert = document.querySelector('[show-alert]');
if (showAlert) {
  const dataTime = parseInt(showAlert.getAttribute('data-time'));
  setTimeout(() => {
    showAlert.classList.add('alert-hidden');
  }, dataTime)
  const closeAlert = showAlert.querySelector('[close-alert]')
  if (closeAlert) {
    closeAlert.addEventListener('click', () => {
      showAlert.classList.add('alert-hidden');
    })
  }
}

// End Show Alert Message


(function () {
  const formRequest = document.getElementById('form-request');
  const formVerify = document.getElementById('form-verify');
  const backBtn = document.getElementById('btn-back');

  if (formRequest && formVerify) {
    formRequest.addEventListener('submit', async e => {
      e.preventDefault();
      const fd = new FormData(formRequest);
      const email = fd.get('email');
      formRequest.querySelector('button[type="submit"]').disabled = true;
      try {
        const res = await fetch(formRequest.action, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Gửi OTP thất bại');
        // chuyển sang bước verify
        formVerify.classList.remove('d-none');
        formRequest.classList.add('d-none');
        formVerify.email.value = email;
      } catch (err) {
        alert(err.message);
      } finally {
        formRequest.querySelector('button[type="submit"]').disabled = false;
      }
    });

    formVerify.addEventListener('submit', async e => {
      e.preventDefault();
      const fd = new FormData(formVerify);
      const payload = {
        email: fd.get('email'),
        otp: fd.get('otp'),
        password: fd.get('password')
      };
      formVerify.querySelector('button[type="submit"]').disabled = true;
      try {
        const res = await fetch(formVerify.action, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Xác thực OTP thất bại');
        alert('Đổi mật khẩu thành công. Vui lòng đăng nhập lại.');
        window.location.href = '/auth/login';
      } catch (err) {
        alert(err.message);
      } finally {
        formVerify.querySelector('button[type="submit"]').disabled = false;
      }
    });
  }

  if (backBtn && formRequest && formVerify) {
    backBtn.addEventListener('click', () => {
      formVerify.classList.add('d-none');
      formRequest.classList.remove('d-none');
    });
  }
})();


const togglePassword = document.getElementById('togglePassword');
const passwordField = document.getElementById('password');
if (togglePassword && passwordField) {
    togglePassword.addEventListener('click', function () {
    const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordField.setAttribute('type', type);

    // Toggle icon
    const icon = this.querySelector('i');
    if (type === 'password') {
      icon.classList.remove('bi-eye');
      icon.classList.add('bi-eye-slash');
    } else {
      icon.classList.remove('bi-eye-slash');
      icon.classList.add('bi-eye');
    }
  });
}