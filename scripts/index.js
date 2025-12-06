document.addEventListener("DOMContentLoaded", function () {
  if (typeof L === "undefined") {
    document.getElementById("map").innerHTML =
      '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#888;">Failed to load map library. Please refresh.</div>';
    return;
  }

  const MAP_KEY = "YOUR_MAP_KEY_HERE";

  const map = L.map("map", {
    center: [39.8, -98.5],
    zoom: 4,
    zoomControl: true,
  });

  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    maxZoom: 19,
  }).addTo(map);

  let fireMarkers = L.layerGroup().addTo(map);
  let fireData = [];

  function getConfidenceColor(confidence) {
    const c = String(confidence).toLowerCase();
    if (c === "h" || c === "high" || parseInt(confidence) >= 80)
      return "#ff3535";
    if (c === "n" || c === "nominal" || parseInt(confidence) >= 50)
      return "#ff6b35";
    return "#ffb835";
  }

  function getConfidenceClass(confidence) {
    const c = String(confidence).toLowerCase();
    if (c === "h" || c === "high" || parseInt(confidence) >= 80) return "high";
    if (c === "n" || c === "nominal" || parseInt(confidence) >= 50)
      return "nominal";
    return "low";
  }

  function getConfidenceLabel(confidence) {
    const c = String(confidence).toLowerCase();
    if (c === "h") return "High";
    if (c === "n") return "Nominal";
    if (c === "l") return "Low";
    return confidence;
  }

  function createFireIcon(color, size = 8) {
    return L.divIcon({
      className: "fire-marker",
      html: `<div style="
                    width: ${size}px;
                    height: ${size}px;
                    background: ${color};
                    border-radius: 50%;
                    box-shadow: 0 0 ${size}px ${color}, 0 0 ${
        size * 2
      }px ${color};
                "></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }

  function formatTime(timeStr) {
    if (!timeStr) return "--:--";
    const str = String(timeStr).padStart(4, "0");
    return `${str.slice(0, 2)}:${str.slice(2)}`;
  }

  function createPopupContent(fire) {
    return `
                <div class="popup-content">
                    <div class="popup-title">🔥 Fire Detection</div>
                    <div class="popup-row">
                        <span class="popup-label">Latitude</span>
                        <span class="popup-value">${fire.latitude.toFixed(
                          5
                        )}°</span>
                    </div>
                    <div class="popup-row">
                        <span class="popup-label">Longitude</span>
                        <span class="popup-value">${fire.longitude.toFixed(
                          5
                        )}°</span>
                    </div>
                    <div class="popup-row">
                        <span class="popup-label">Brightness</span>
                        <span class="popup-value">${
                          fire.bright_ti4 || fire.brightness || "--"
                        } K</span>
                    </div>
                    <div class="popup-row">
                        <span class="popup-label">FRP</span>
                        <span class="popup-value">${fire.frp || "--"} MW</span>
                    </div>
                    <div class="popup-row">
                        <span class="popup-label">Confidence</span>
                        <span class="popup-value">${getConfidenceLabel(
                          fire.confidence
                        )}</span>
                    </div>
                    <div class="popup-row">
                        <span class="popup-label">Date</span>
                        <span class="popup-value">${
                          fire.acq_date || "--"
                        }</span>
                    </div>
                    <div class="popup-row">
                        <span class="popup-label">Time (UTC)</span>
                        <span class="popup-value">${formatTime(
                          fire.acq_time
                        )}</span>
                    </div>
                    <div class="popup-row">
                        <span class="popup-label">Satellite</span>
                        <span class="popup-value">${
                          fire.satellite || "--"
                        }</span>
                    </div>
                </div>
            `;
  }

  function renderFireMarkers(data) {
    fireMarkers.clearLayers();
    fireData = data;

    data.forEach((fire, index) => {
      const color = getConfidenceColor(fire.confidence);
      const frp = parseFloat(fire.frp) || 1;
      const size = Math.max(6, Math.min(16, 6 + Math.log(frp) * 2));

      const marker = L.marker([fire.latitude, fire.longitude], {
        icon: createFireIcon(color, size),
      });

      marker.bindPopup(createPopupContent(fire), {
        closeButton: false,
        className: "fire-popup",
      });

      marker.on("mouseover", function () {
        this.openPopup();
      });
      marker.on("mouseout", function () {
        this.closePopup();
      });
      marker.on("click", function () {
        map.setView([fire.latitude, fire.longitude], 10);
      });

      fireMarkers.addLayer(marker);
    });

    document.getElementById("fireCount").textContent =
      data.length.toLocaleString();
    document.getElementById("lastUpdate").textContent =
      new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });

    renderFireList(data.slice(0, 20));
  }

  function renderFireList(data) {
    const container = document.getElementById("fireList");

    if (data.length === 0) {
      container.innerHTML = `
                    <div style="font-size: 12px; color: var(--text-secondary); text-align: center; padding: 20px;">
                        No fires detected in this region
                    </div>
                `;
      return;
    }

    container.innerHTML = data
      .map(
        (fire, i) => `
                <div class="fire-item" data-index="${i}">
                    <div class="fire-item-header">
                        <span class="fire-item-coords">${fire.latitude.toFixed(
                          3
                        )}°, ${fire.longitude.toFixed(3)}°</span>
                        <span class="fire-item-confidence ${getConfidenceClass(
                          fire.confidence
                        )}">${getConfidenceLabel(fire.confidence)}</span>
                    </div>
                    <div class="fire-item-meta">${fire.acq_date} ${formatTime(
          fire.acq_time
        )} UTC • FRP: ${fire.frp || "--"} MW</div>
                </div>
            `
      )
      .join("");

    container.querySelectorAll(".fire-item").forEach((item, i) => {
      item.addEventListener("click", () => {
        const fire = data[i];
        map.setView([fire.latitude, fire.longitude], 10);
      });
    });
  }

  function parseCSV(csv) {
    const lines = csv.trim().split("\n");
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",");
      if (values.length !== headers.length) continue;

      const row = {};
      headers.forEach((h, j) => {
        const val = values[j].trim();
        row[h] = isNaN(val) ? val : parseFloat(val);
      });

      if (row.latitude && row.longitude) {
        data.push(row);
      }
    }

    return data;
  }

  function showLoading(show) {
    const overlay = document.getElementById("loadingOverlay");
    overlay.classList.toggle("active", show);
    document.getElementById("fetchBtn").disabled = show;
  }

  async function fetchFireData() {
    const sensor = document.getElementById("sensorSelect").value;
    const days = document.getElementById("dayRange").value;
    const w = document.getElementById("bboxW").value;
    const s = document.getElementById("bboxS").value;
    const e = document.getElementById("bboxE").value;
    const n = document.getElementById("bboxN").value;

    const bbox = `${w},${s},${e},${n}`;

    showLoading(true);

    if (MAP_KEY === "YOUR_MAP_KEY_HERE") {
      setTimeout(() => {
        const demoData = generateDemoData(150, [w, s, e, n]);
        renderFireMarkers(demoData);
        showLoading(false);
      }, 1500);
      return;
    }

    try {
      const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${MAP_KEY}/${sensor}/${bbox}/${days}`;
      const response = await fetch(url);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const csv = await response.text();
      const data = parseCSV(csv);
      renderFireMarkers(data);
    } catch (error) {
      console.error("Fetch error:", error);
      alert("Failed to fetch fire data. Check your API key and try again.");
    } finally {
      showLoading(false);
    }
  }

  function generateDemoData(count, bounds) {
    const [w, s, e, n] = bounds.map(Number);
    const data = [];
    const confidences = ["h", "n", "l"];
    const satellites = ["N", "N20", "N21"];

    for (let i = 0; i < count; i++) {
      const lat = s + Math.random() * (n - s);
      const lng = w + Math.random() * (e - w);

      data.push({
        latitude: lat,
        longitude: lng,
        bright_ti4: 300 + Math.random() * 80,
        scan: 0.4 + Math.random() * 0.3,
        track: 0.4 + Math.random() * 0.3,
        acq_date: new Date().toISOString().split("T")[0],
        acq_time: Math.floor(Math.random() * 2400),
        satellite: satellites[Math.floor(Math.random() * satellites.length)],
        instrument: "VIIRS",
        confidence: confidences[Math.floor(Math.random() * confidences.length)],
        version: "2.0NRT",
        bright_ti5: 280 + Math.random() * 30,
        frp: Math.random() * 50,
        daynight: Math.random() > 0.5 ? "D" : "N",
      });
    }

    return data;
  }

  document.getElementById("fetchBtn").addEventListener("click", fetchFireData);

  map.on("moveend", function () {
    const bounds = map.getBounds();
    document.getElementById("bboxW").value = bounds.getWest().toFixed(2);
    document.getElementById("bboxS").value = bounds.getSouth().toFixed(2);
    document.getElementById("bboxE").value = bounds.getEast().toFixed(2);
    document.getElementById("bboxN").value = bounds.getNorth().toFixed(2);
  });

  fetchFireData();
});
