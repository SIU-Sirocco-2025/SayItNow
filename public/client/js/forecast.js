(function() {
  const districtSelect = document.getElementById('district-select');
  const btnForecast = document.getElementById('btn-forecast');
  const loadingEl = document.getElementById('forecast-loading');
  const errorEl = document.getElementById('forecast-error');
  const resultEl = document.getElementById('forecast-result');

  // Load danh sách quận
  async function loadDistricts() {
    try {
      const response = await fetch('/api/prediction/districts');
      const data = await response.json();
      
      if (data.success && data.districts) {
        data.districts
          .filter(d => d.hasModel)
          .forEach(district => {
            const option = document.createElement('option');
            option.value = district.key;
            option.textContent = district.label;
            districtSelect.appendChild(option);
          });
      }
    } catch (error) {
      console.error('Lỗi tải danh sách quận:', error);
    }
  }

  // Hàm phân loại AQI
  function getAQIClass(aqi) {
    if (aqi <= 50) return { key: 'good', label: 'Tốt', color: '#2ecc71' };
    if (aqi <= 100) return { key: 'moderate', label: 'Trung bình', color: '#f1c40f' };
    if (aqi <= 150) return { key: 'unhealthy', label: 'Xấu', color: '#e67e22' };
    if (aqi <= 200) return { key: 'unhealthy', label: 'Xấu', color: '#e67e22' };
    if (aqi <= 300) return { key: 'very-unhealthy', label: 'Rất xấu', color: '#8e44ad' };
    return { key: 'hazardous', label: 'Nguy hại', color: '#e74c3c' };
  }

  // Format thời gian
  function formatHour(timestamp) {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${hours}h ${day}/${month}`;
  }

  // Vẽ biểu đồ đơn giản
 function renderChart(predictions) {
    const chartEl = document.getElementById('forecast-chart');
    const maxAQI = Math.max(...predictions.map(p => p.aqius));
    const minAQI = Math.min(...predictions.map(p => p.aqius));
    
    // Tính scale với buffer để không bị quá sát
    const buffer = 20;
    const chartHeight = 200;
    const scale = chartHeight / (maxAQI - minAQI + buffer);

    let html = '<div class="forecast-chart-wrapper" style="display:flex;align-items:flex-end;gap:6px;height:220px;overflow-x:auto;padding:20px 10px 10px 10px;background:#f8f9fa;border-radius:8px;">';
    
    predictions.forEach((pred, idx) => {
      const aqiClass = getAQIClass(pred.aqius);
      // Tính chiều cao relative
      const relativeHeight = (pred.aqius - minAQI + buffer/2) * scale;
      const height = Math.max(30, relativeHeight); // Min height 30px
      
      // Hiển thị label giờ mỗi 3 giờ (giờ 1, 4, 7, 10, 13, 16, 19, 22)
      const showLabel = pred.hour === 1 || (pred.hour - 1) % 3 === 0;
      
      html += `
        <div style="flex:0 0 36px;text-align:center;position:relative;">
          <div style="height:${height}px;background:${aqiClass.color};border-radius:6px 6px 4px 4px;position:relative;box-shadow:0 2px 4px rgba(0,0,0,.1);transition:all .2s;" title="Giờ ${pred.hour}: ${pred.aqius} AQI - ${aqiClass.label}">
            <span style="position:absolute;top:-18px;left:50%;transform:translateX(-50%);font-size:11px;font-weight:700;color:${aqiClass.color};white-space:nowrap;">${Math.round(pred.aqius)}</span>
          </div>
          ${showLabel ? `<small style="font-size:10px;color:#666;margin-top:6px;display:block;font-weight:600;">${pred.hour}h</small>` : '<div style="height:20px;"></div>'}
        </div>`;
    });
    
    html += '</div>';
    
    // Thêm chú thích nhỏ
    html += '<p class="text-muted small mt-2 mb-0"><i class="bi bi-info-circle me-1"></i>Di chuột vào cột để xem chi tiết từng giờ</p>';
    
    chartEl.innerHTML = html;
  }

  // Vẽ bảng chi tiết
  function renderTable(predictions) {
    const container = document.getElementById('forecast-table-container');
    const chunked = [];
    
    // Chia thành nhóm 6 giờ
    for (let i = 0; i < predictions.length; i += 6) {
      chunked.push(predictions.slice(i, i + 6));
    }

    let html = '<div class="row g-3">';
    
    chunked.forEach((chunk, chunkIdx) => {
      html += `
        <div class="col-md-6">
          <div class="card border-0" style="background:#f8f9fa;">
            <div class="card-body">
              <h6 class="mb-3">Giờ ${chunkIdx * 6 + 1} - ${Math.min((chunkIdx + 1) * 6, 24)}</h6>
              <div class="table-responsive">
                <table class="table table-sm table-borderless mb-0">
                  <tbody>`;
      
      chunk.forEach(pred => {
        const aqiClass = getAQIClass(pred.aqius);
        html += `
          <tr>
            <td class="text-muted" style="width:100px;">${formatHour(pred.timestamp)}</td>
            <td><strong>${Math.round(pred.aqius)}</strong></td>
            <td><span class="badge" style="background:${aqiClass.color}1f;color:${aqiClass.color}">${aqiClass.label}</span></td>
          </tr>`;
      });
      
      html += `
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>`;
    });
    
    html += '</div>';
    container.innerHTML = html;
  }

  // Xử lý dự báo
  async function handleForecast() {
    const district = districtSelect.value;
    
    if (!district) {
      errorEl.textContent = 'Vui lòng chọn quận để xem dự báo';
      errorEl.classList.remove('d-none');
      return;
    }

    // Reset UI
    errorEl.classList.add('d-none');
    resultEl.classList.add('d-none');
    loadingEl.classList.remove('d-none');
    btnForecast.disabled = true;

    try {
      const response = await fetch(`/api/prediction/forecast-24h/${district}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Lỗi không xác định');
      }

      // Hiển thị kết quả
      document.getElementById('forecast-district').textContent = data.districtLabel || district;
      document.getElementById('forecast-mean').textContent = data.statistics?.mean || '--';
      document.getElementById('forecast-max').textContent = data.statistics?.max || '--';
      document.getElementById('forecast-min').textContent = data.statistics?.min || '--';

      // Vẽ biểu đồ và bảng
      if (data.predictions && data.predictions.length > 0) {
        renderChart(data.predictions);
        renderTable(data.predictions);
      }

      loadingEl.classList.add('d-none');
      resultEl.classList.remove('d-none');

    } catch (error) {
      console.error('Lỗi dự báo:', error);
      errorEl.textContent = error.message || 'Có lỗi xảy ra khi tải dự báo';
      errorEl.classList.remove('d-none');
      loadingEl.classList.add('d-none');
    } finally {
      btnForecast.disabled = false;
    }
  }

  // Event listeners
  btnForecast.addEventListener('click', handleForecast);
  
  // Load danh sách quận khi trang load
  loadDistricts();
})();