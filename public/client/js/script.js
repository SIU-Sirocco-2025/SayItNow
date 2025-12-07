// Bản đồ AQI phía client + hành vi UI (nâng cao)
(function initAQIMap() {
  function aqiClass(aqius) {
    if (aqius <= 50) return { key: 'good', color: '#1a9e3e', label: 'Tốt' };
    if (aqius <= 100) return { key: 'moderate', color: '#95d500', label: 'Trung bình' };
    if (aqius <= 150) return { key: 'unhealthy-for-sensitive', color: '#f1c40f', label: 'Nhạy cảm' };
    if (aqius <= 200) return { key: 'unhealthy', color: '#e67e22', label: 'Xấu' };
    if (aqius <= 300) return { key: 'very-unhealthy', color: '#ff8c00', label: 'Rất xấu' };
    return { key: 'hazardous', color: '#d41e3a', label: 'Nguy hại' };
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
    const displayAqi = typeof aqi === 'number' ? Math.round(aqi) : (aqi ?? '--');
    valueEl.textContent = displayAqi;
    root.title = `Cập nhật: ${formatTime(ts)} • ${info.label}`;
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
  let voronoiLayer = null;
  let userMarker = null;
  const markerById = new Map();
  const layerState = { voronoi: true, markers: true };

  // Khung trực quan cho khu vực tập trung
  L.rectangle(HCMC_BOUNDS, { color: '#f39c12', weight: 1, fill: false, dashArray: '6 4' }).addTo(map);

  // Tham chiếu DOM
  const layerButtons = document.querySelectorAll('[data-layer-toggle]');
  const styleButtons = document.querySelectorAll('[data-map-style]');
  const locateBtn = document.querySelector('[data-map-action="locate"]');
  const stationContainer = document.getElementById('aqi-stations');
  const stationsUpdatedEl = document.querySelector('[data-stations-updated]');
  const cityHeroEl = document.getElementById('aqi-city-hero');

  let cityOverlay = null;

  const adviceTexts = {
    good: 'Không khí an toàn, bạn có thể sinh hoạt ngoài trời bình thường.',
    moderate: 'Người nhạy cảm nên giảm thời gian ngoài trời, người khác vẫn ổn.',
    unhealthy: 'Cần thận trọng: giảm hoạt động mạnh và nên đeo khẩu trang phù hợp.',
    'very-unhealthy': 'Hạn chế ra ngoài nếu không cần thiết, ưu tiên ở trong nhà.',
    hazardous: 'Mức nguy hiểm: nên ở trong nhà và sử dụng thiết bị lọc không khí nếu có.'
  };

  // Lưu trữ dữ liệu trạm
  let allStations = [];
  let nearestStation = null;
  let cityWideStation = null;

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

  function renderCityHero(station) {
    if (!cityHeroEl) return;
    if (!station) {
      cityHeroEl.innerHTML = '';
      cityHeroEl.classList.add('d-none');
      return;
    }
    cityHeroEl.classList.remove('d-none');
    const props = station.properties || {};
    const rawAqi = Number(props.aqius || 0);
    const aqius = rawAqi ? Math.round(rawAqi) : '--';
    const info = aqiClass(rawAqi);
    const tsText = props.ts ? formatTime(props.ts) : '--';
    const label = props.city || 'Thành phố Hồ Chí Minh';
    const key = props.cityKey || 'city-wide';
    cityHeroEl.innerHTML = `
      <div class="aqi-city-hero-card card aqi-card-${info.key}" data-station-id="${key}">
        <div class="card-body d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
          <div class="flex-grow-1">
            <p class="text-uppercase small fw-semibold text-muted mb-1">
              <i class="bi bi-broadcast-pin me-1"></i>Trạm tổng
            </p>
            <h3 class="h4 mb-1">${label}</h3>
            <p class="mb-2 text-muted d-flex align-items-center gap-2">
              <i class="bi bi-geo me-1"></i>Phủ sóng toàn thành phố
            </p>
            <span class="aqi-city-chip me-2 badge rounded-pill px-3 py-2" style="background:${info.color}1f;color:${info.color};border:1px solid ${info.color}33">${info.label}</span>
            <button type="button" class="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1" data-city-hour-btn>
              <i class="bi bi-clock-history"></i>
              <span>Thông số giờ gần nhất</span>
            </button>
          </div>
          <div class="text-center">
            <div class="display-4 fw-bold mb-0">${aqius}</div>
            <div class="text-muted">AQI</div>
            <div class="mt-2 small text-muted d-flex align-items-center justify-content-center gap-1">
              <i class="bi bi-arrow-repeat"></i><span>Cập nhật: ${tsText}</span>
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
      wrap.innerHTML = '<div class="city-hour-card small text-muted">Không có dữ liệu giờ gần nhất.</div>';
      wrap.classList.remove('d-none');
      return;
    }
    const win = data.window || {};
    const fromText = formatTime(win.fromLocal || win.from);
    const toText = formatTime(win.toLocal || win.to);

    // Mapping chuẩn
    const SENSOR_META = {
      pm1: { display: 'PM1.0', unit: 'µg/m³', icon: 'bi-bullseye' },
      pm25: { display: 'PM2.5', unit: 'µg/m³', icon: 'bi-cloud-haze2' },
      relativehumidity: { display: 'Độ ẩm', unit: '%', icon: 'bi-droplet-half' },
      temperature: { display: 'Nhiệt độ', unit: '°C', icon: 'bi-thermometer-half' },
      um003: { display: 'PM0.3', unit: 'particles/cm³', icon: 'bi-stars' }
    };

    // Đánh giá cảnh báo theo ngưỡng
    function isCritical(key, value) {
      if (typeof value !== 'number') return false;
      switch (key) {
        case 'pm25': return value >= 35;            // Khuyến nghị WHO 24h ~35 µg/m³
        case 'pm1': return value >= 35;
        case 'temperature': return value <= 15 || value >= 35;
        case 'relativehumidity': return value <= 20 || value >= 85;
        case 'um003': return value >= 1000;
        default: return false;
      }
    }

    const sensorMeta = k => SENSOR_META[k] || { display: k, unit: '', icon: 'bi-info-circle' };
    const orderWeight = k => ({ pm1: 1, pm25: 2, relativehumidity: 3, temperature: 4, um003: 5 }[k] || 99);

    const rows = (data.measurements || [])
      .sort((a, b) => orderWeight(a.key) - orderWeight(b.key))
      .map(m => {
        const meta = sensorMeta(m.key);
        const warn = isCritical(m.key, m.value);
        const displayValue = typeof m.value === 'number' ? m.value.toFixed(1) : (m.value ?? '--');
        return `
        <tr class="${warn ? 'table-warning' : ''}">
          <td class="text-muted">
            <i class="bi ${meta.icon} me-1"></i>${meta.display}
          </td>
          <td>
            <span class="fw-semibold">${displayValue}</span>
            ${warn ? '<span class="badge bg-danger-subtle text-danger ms-2">Cảnh báo</span>' : ''}
          </td>
          <td class="text-muted">${meta.unit}</td>
        </tr>`;
      }).join('');

    wrap.innerHTML = `
    <div class="city-hour-card card border-0 shadow-sm">
      <div class="card-header bg-white border-0 pb-0 d-flex justify-content-between align-items-center">
        <h5 class="h6 mb-0 d-flex align-items-center gap-2">
          <i class="bi bi-clock-history text-primary"></i><span>Thông số giờ gần nhất</span>
        </h5>
        <button type="button" class="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1" data-city-hour-close>
          <i class="bi bi-x-lg"></i><span>Đóng</span>
        </button>
      </div>
      <div class="card-body pt-2">
        <p class="small text-muted mb-3">
          <i class="bi bi-calendar-range me-1"></i>
          Khung giờ: <strong>${fromText}</strong>
          <span class="mx-1">→</span>
          <strong>${toText}</strong>
        </p>
        <div class="row g-3 mb-3 city-hour-metrics">
          ${(data.measurements || []).sort((a, b) => orderWeight(a.key) - orderWeight(b.key)).map(m => {
      const meta = sensorMeta(m.key);
      const cls = isCritical(m.key, m.value) ? 'metric-item danger' : 'metric-item';
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
              <tr><th>Cảm biến</th><th>Giá trị</th><th>Đơn vị</th></tr>
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

  function updateRecommendations(aqi) {
    // Ẩn tất cả khuyến nghị
    const groups = document.querySelectorAll('[data-advice-group]');
    groups.forEach(g => g.style.display = 'none');
    
    // Hiển thị khuyến nghị phù hợp
    const cls = aqiClass(aqi);
    const activeGroup = document.querySelector(`[data-advice-group="${cls.key}"]`);
    if (activeGroup) activeGroup.style.display = 'block';
  }

  function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Bán kính Trái Đất (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  function findNearestStation(userLat, userLng) {
    if (!allStations.length) return null;
    let nearest = null;
    let minDistance = Infinity;
    allStations.forEach(station => {
      const props = station.properties || {};
      const lat = Number(props.latitude || props.lat || 0);
      const lng = Number(props.longitude || props.lng || 0);
      if (!lat || !lng) return;
      const distance = calculateDistance(userLat, userLng, lat, lng);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = station;
      }
    });
    return nearest;
  }

  function renderStationAqiCard(station) {
    const container = document.getElementById('station-aqi-card');
    if (!container || !station) return;

    const props = station.properties || {};
    const aqius = Number(props.aqius || 0);
    const info = aqiClass(aqius);
    const city = props.city || 'Trạm';
    const ts = props.ts ? formatTime(props.ts) : '--';

    // Emoji tương ứng với level
    let emoji = '😊';
    if (aqius <= 50) emoji = '😊';
    else if (aqius <= 100) emoji = '😐';
    else if (aqius <= 150) emoji = '😟';
    else if (aqius <= 200) emoji = '😕';
    else if (aqius <= 300) emoji = '😢';
    else emoji = '😱';

    container.innerHTML = `
      <div class="station-aqi-display p-3 rounded" style="background: linear-gradient(135deg, ${info.color}20 0%, ${info.color}05 100%); border-left: 4px solid ${info.color};">
        <p class="text-muted small mb-2">${city}</p>
        <div class="d-flex align-items-center gap-3 mb-2">
          <div class="d-flex align-items-baseline gap-2">
            <span class="display-4 fw-bold" style="color: ${info.color};">${Math.round(aqius)}</span>
            <span class="h6 text-muted">AQI</span>
          </div>
          <div style="font-size: 3rem; background: rgba(0,0,0,0.1); width: 70px; height: 70px; display: flex; align-items: center; justify-content: center; border-radius: 12px;">${emoji}</div>
        </div>
        <p class="small mb-0" style="color: ${info.color}; font-weight: 600;">${info.label}</p>
        <p class="small text-muted mb-0 mt-2">
          <i class="bi bi-clock"></i> ${ts}
        </p>
      </div>
    `;
  }

  function handleStationSelection() {
    const selector = document.getElementById('station-selector');
    if (!selector) return;

    selector.addEventListener('change', (e) => {
      const stationId = e.target.value;
      const selectedStation = allStations.find(s => s.properties?.idx === stationId);
      
      if (selectedStation) {
        const selectedAqi = Number(selectedStation.properties?.aqius || 0);
        renderStationAqiCard(selectedStation);
        updateRecommendations(selectedAqi);
      }
    });
  }

  function populateStationSelector() {
    const selector = document.getElementById('station-selector');
    if (!selector || !allStations.length) return;

    // Lấy vị trí user
    let userLat = 10.7769; // Mặc định HCM center
    let userLng = 106.6955;

    if (userMarker) {
      const latLng = userMarker.getLatLng();
      userLat = latLng.lat;
      userLng = latLng.lng;
    }

    // Tính khoảng cách cho tất cả trạm
    const stationsWithDistance = allStations.map(station => {
      const props = station.properties || {};
      const lat = Number(props.latitude || props.lat || 0);
      const lng = Number(props.longitude || props.lng || 0);
      const distance = lat && lng ? calculateDistance(userLat, userLng, lat, lng) : Infinity;
      return {
        station,
        distance,
        city: props.city || 'Trạm',
        idx: props.idx
      };
    });

    // Sắp xếp theo khoảng cách
    stationsWithDistance.sort((a, b) => a.distance - b.distance);

    // Xóa options cũ
    selector.innerHTML = '';

    // Thêm options mới
    stationsWithDistance.forEach((item, index) => {
      const option = document.createElement('option');
      option.value = item.idx;
      const distanceText = item.distance !== Infinity ? ` (${item.distance.toFixed(1)}km)` : '';
      const icon = index === 0 ? '🎯' : '📍';
      option.textContent = `${icon} ${item.city}${distanceText}`;
      selector.appendChild(option);
    });

    // Chọn trạm đầu tiên (gần nhất)
    if (stationsWithDistance.length > 0) {
      selector.value = stationsWithDistance[0].idx;
      // Render card AQI cho trạm đầu tiên
      renderStationAqiCard(stationsWithDistance[0].station);
      const selectedAqi = Number(stationsWithDistance[0].station.properties?.aqius || 0);
      updateRecommendations(selectedAqi);
    }
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
    status.textContent = `Mức độ hiện tại: ${cls.label}`;
    sub.textContent = adviceTexts[cls.key] || adviceTexts.unhealthy;
    
    // Cập nhật khuyến nghị dựa trên AQI trung bình
    updateRecommendations(avg);

    wrap.classList.remove('aqi-theme-good', 'aqi-theme-moderate', 'aqi-theme-unhealthy-for-sensitive', 'aqi-theme-unhealthy', 'aqi-theme-very-unhealthy', 'aqi-theme-hazardous');
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
          cls.key === 'unhealthy-for-sensitive' ? 'aqi-theme-unhealthy-for-sensitive' :
            cls.key === 'unhealthy' ? 'aqi-theme-unhealthy' :
              cls.key === 'very-unhealthy' ? 'aqi-theme-very-unhealthy' : 'aqi-theme-hazardous'
    );
  }

  function renderVoronoiLayer(stations, cityStation) {
    if (!window.turf) {
      console.warn('Turf.js not loaded yet');
      return;
    }
    
    if (voronoiLayer) map.removeLayer(voronoiLayer);
    voronoiLayer = L.layerGroup();

    // Tạo GeoJSON point collection từ danh sách trạm
    const points = (stations || []).map((f, idx) => {
      const [lng, lat] = f.geometry.coordinates || [];
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      
      const props = f.properties || {};
      const aqius = Number(props.aqius || 0);
      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [lng, lat] },
        properties: {
          aqius,
          city: props.city || 'Trạm',
          ts: props.ts,
          idx
        }
      };
    }).filter(p => p !== null);

    if (points.length < 3) {
      console.warn('Need at least 3 stations for Voronoi diagram');
      if (layerState.voronoi) voronoiLayer.addTo(map);
      return;
    }

    const pointCollection = { type: 'FeatureCollection', features: points };

    // Lấy bounding box để giới hạn Voronoi
    const bbox = [106.40, 10.40, 107.10, 10.97]; // [minLng, minLat, maxLng, maxLat]

    try {
      // Tạo Voronoi diagram
      const voronoi = window.turf.voronoi(pointCollection, { bbox });

      // Render mỗi polygon với màu AQI
      (voronoi.features || []).forEach(feature => {
        const props = feature.properties || {};
        const originIdx = props['site-index'];
        const originalFeature = points[originIdx];
        
        if (!originalFeature) return;

        const aqius = Number(originalFeature.properties.aqius || 0);
        const info = aqiClass(aqius);
        const label = originalFeature.properties.city;

        // Tạo GeoJSON layer cho polygon
        const geoJsonFeature = {
          type: 'Feature',
          geometry: feature.geometry,
          properties: {
            aqius,
            label,
            info: info.label
          }
        };

        const geoJsonLayer = L.geoJSON(geoJsonFeature, {
          style: {
            fillColor: info.color,
            fillOpacity: 0.6,
            color: info.color,
            weight: 2,
            dashArray: '3,3'
          },
          onEachFeature: (feature, layer) => {
            const props = feature.properties;
            const displayAqi = Math.round(props.aqius);
            const tsText = originalFeature.properties.ts ? formatTime(originalFeature.properties.ts) : '--';

            // Tooltip khi hover
            layer.bindTooltip(`<div style="text-align:center;"><strong style="font-size:1.05em;color:#333;">📍 ${props.label}</strong><br/><div style="margin:6px 0;font-weight:bold;color:${info.color};">AQI: ${displayAqi}</div><div style="font-size:0.9em;">${props.info}</div></div>`, {
              direction: 'center',
              sticky: true
            });

            // Popup khi click
            layer.bindPopup(`
              <div class="voronoi-popup aqi-popup-${info.key}">
                <strong style="display:block;margin-bottom:6px;font-size:1.05em;">📍 ${props.label}</strong>
                <div style="font-size:1.3em;font-weight:bold;color:${info.color};margin:6px 0;">${displayAqi} AQI</div>
                <div class="small text-muted">${props.info}</div>
                <div class="small text-muted" style="margin-top:6px;"><i class="bi bi-clock-history"></i> ${tsText}</div>
              </div>
            `, {
              className: `popup-${info.key}`,
              maxWidth: 250,
              closeButton: true,
              autoPan: true,
              autoPanPadding: [50, 50]
            });

            // Hover effect
            layer.on('mouseover', function() {
              this.setStyle({ weight: 3, dashArray: '', fillOpacity: 0.8 });
            });

            layer.on('mouseout', function() {
              this.setStyle({ weight: 2, dashArray: '3,3', fillOpacity: 0.6 });
            });
          }
        });

        voronoiLayer.addLayer(geoJsonLayer);
      });

      if (layerState.voronoi) voronoiLayer.addTo(map);
    } catch (error) {
      console.error('Error generating Voronoi diagram:', error);
    }
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
      const displayAqi = typeof aqius === 'number' ? Math.round(aqius) : aqius;
      const divIcon = L.divIcon({
        className: 'pm-icon',
        html: `<span class="${classes}" style="color:${info.color}"></span><span class="pm-aqi-label">${displayAqi}</span>`,
        iconSize: [35, 25],
        iconAnchor: [17, 12]
      });
      const label = props.city || 'Trạm';
      const tsText = props.ts ? formatTime(props.ts) : '--';
      const marker = L.marker([lat, lng], { icon: divIcon })
        .bindTooltip(`
          <div class="station-popup aqi-popup-${info.key}">
            <strong style="display:block;margin-bottom:6px;font-size:1.1em;color:#333;">📍 ${label}</strong>
            <div style="font-size:1.3em;font-weight:bold;color:${info.color};margin:6px 0;">${displayAqi} AQI</div>
            <div class="small text-muted" style="margin:4px 0;">${info.label}</div>
            <div class="small text-muted" style="margin-top:6px;"><i class="bi bi-clock-history" style="margin-right:4px;"></i>${tsText}</div>
          </div>
        `, { 
          className: `tooltip-${info.key}`,
          direction: 'top',
          sticky: true,
          permanent: false
        });
      markerLayer.addLayer(marker);
      const key = props.cityKey || props.city || `station-${idx}`;
      markerById.set(key, marker);
    });
    if (!layerState.markers) map.removeLayer(markerLayer);
  }

  function renderStationCards(stations) {
    if (!stationContainer) return;
    // Hide the district cards container
    stationContainer.innerHTML = '';
    stationContainer.classList.add('d-none');
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
    if (voronoiLayer) {
      if (layerState.voronoi) voronoiLayer.addTo(map);
      else map.removeLayer(voronoiLayer);
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
      const div = L.DomUtil.create('div', 'card p-3 shadow-sm small aqi-legend-control');
      const legendItems = [
        { min: 0, max: 50, label: 'Tốt', color: '#1a9e3e', range: '0-50' },
        { min: 51, max: 100, label: 'Trung bình', color: '#95d500', range: '51-100' },
        { min: 101, max: 150, label: 'Nhạy cảm', color: '#f1c40f', range: '101-150' },
        { min: 151, max: 200, label: 'Xấu', color: '#e67e22', range: '151-200' },
        { min: 201, max: 300, label: 'Rất xấu', color: '#ff8c00', range: '201-300' },
        { min: 301, max: 999, label: 'Nguy hại', color: '#d41e3a', range: '300+' }
      ];
      
      const header = L.DomUtil.create('div');
      header.innerHTML = '<div style="font-weight:bold;margin-bottom:8px;">AQI</div>';
      div.appendChild(header);
      
      const gradientBar = L.DomUtil.create('div', 'aqi-gradient-bar');
      gradientBar.style.cssText = `
        width:100%;
        height:20px;
        background: linear-gradient(to right, #1a9e3e 0%, #95d500 20%, #f1c40f 40%, #e67e22 60%, #ff8c00 80%, #d41e3a 100%);
        border-radius:4px;
        margin-bottom:8px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      `;
      div.appendChild(gradientBar);
      
      const rangeLabel = L.DomUtil.create('div', 'aqi-range-label');
      rangeLabel.style.cssText = 'font-size:0.8em;color:#666;text-align:center;margin-bottom:8px;';
      rangeLabel.textContent = '0 ← AQI → 300+';
      div.appendChild(rangeLabel);
      
      legendItems.forEach(item => {
        const itemDiv = L.DomUtil.create('div', 'aqi-legend-item');
        itemDiv.style.cssText = `
          display:flex;
          align-items:center;
          gap:6px;
          padding:6px;
          margin:2px -6px;
          border-radius:4px;
        `;
        itemDiv.innerHTML = `
          <span style="display:inline-block;width:12px;height:12px;background:${item.color};border-radius:2px;flex-shrink:0;"></span>
          <span style="flex:1;">${item.range} ${item.label}</span>
        `;
        
        div.appendChild(itemDiv);
      });
      
      return div;
    };
    legend.addTo(map);
  }
  
  function filterMarkersByRange(minAqi, maxAqi) {
    markerLayer.eachLayer(marker => {
      const markerEl = marker.getElement();
      if (!markerEl) return;
      markerEl.style.opacity = '0.3';
      markerEl.style.transition = 'opacity 0.2s ease';
    });
    
    let count = 0;
    markerById.forEach((marker, key) => {
      const markerEl = marker.getElement();
      if (!markerEl) return;
      const span = markerEl.querySelector('.pm-dot');
      if (!span) {
        markerEl.style.opacity = '0.3';
        return;
      }
      
      const aqiText = span.parentElement?.title || '';
      const aqiMatch = aqiText.match(/AQI:\s*(\d+)/);
      const aqius = aqiMatch ? Number(aqiMatch[1]) : 0;
      
      if (aqius >= minAqi && aqius <= maxAqi) {
        markerEl.style.opacity = '1';
        markerEl.style.zIndex = '1000';
        count++;
      } else {
        markerEl.style.opacity = '0.3';
        markerEl.style.zIndex = 'auto';
      }
    });
    
    if (count > 0) {
      console.log(`Hiển thị ${count} trạm trong khoảng ${minAqi}-${maxAqi}`);
    }
  }

  function handleLocate() {
    if (!navigator.geolocation) {
      alert('Trình duyệt không hỗ trợ định vị.');
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
          }).bindTooltip('Vị trí của bạn', { direction: 'top' }).addTo(map);
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

  // Sự kiện UI
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
    stationsUpdatedEl.textContent = `Cập nhật lúc ${formatTime(latest)}`;
  }

  fetch('/aqi/data')
    .then(r => r.json())
    .then(fc => {
      if (!fc || !Array.isArray(fc.features)) return;
      const { cityStation, districts } = splitStations(fc.features);
      
      // Lưu trữ dữ liệu
      allStations = districts;
      cityWideStation = cityStation;
      
      // Tìm trạm gần nhất (nếu có vị trí user)
      if (userMarker) {
        const userLat = userMarker.getLatLng().lat;
        const userLng = userMarker.getLatLng().lng;
        nearestStation = findNearestStation(userLat, userLng);
      } else {
        // Dùng trạm đầu tiên nếu không có vị trí user
        nearestStation = districts.length > 0 ? districts[0] : null;
      }
      
      updateStatusbar(fc.features);
      renderMarkers(districts, cityStation);
      renderVoronoiLayer(districts, cityStation);
      renderCityHero(cityStation);
      applyCityOverlay(cityStation);
      renderStationCards(districts);
      updateStationsTimestamp(fc.features);
      addLegendControl();
      
      // Khởi tạo selector với danh sách các trạm
      handleStationSelection();
      populateStationSelector();
    })
    .catch(() => { });
})();


// Hiển thị thông báo (Alert)

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

// Kết thúc hiển thị thông báo (Alert)


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
        // chuyển sang bước xác minh
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

    // Đổi icon
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
