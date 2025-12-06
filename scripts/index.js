document.addEventListener("DOMContentLoaded", function () {
  if (typeof L === "undefined") {
    document.getElementById("map").innerHTML =
      '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#888;">Failed to load map library. Please refresh.</div>';
    return;
  }

  const MAP_KEY = "b1e3672d4f5948aac30aab174780c551";

  if (MAP_KEY !== "b1e3672d4f5948aac30aab174780c551") {
    document.getElementById("apiNotice").style.display = "none";
  }

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

    let w = parseFloat(document.getElementById("bboxW").value) || -125;
    let s = parseFloat(document.getElementById("bboxS").value) || 25;
    let e = parseFloat(document.getElementById("bboxE").value) || -65;
    let n = parseFloat(document.getElementById("bboxN").value) || 50;

    w = Math.max(-180, Math.min(180, w));
    e = Math.max(-180, Math.min(180, e));
    s = Math.max(-90, Math.min(90, s));
    n = Math.max(-90, Math.min(90, n));

    document.getElementById("bboxW").value = w.toFixed(2);
    document.getElementById("bboxS").value = s.toFixed(2);
    document.getElementById("bboxE").value = e.toFixed(2);
    document.getElementById("bboxN").value = n.toFixed(2);

    const isWorld = w === -180 && s === -90 && e === 180 && n === 90;
    const bbox = isWorld ? "world" : `${w},${s},${e},${n}`;

    showLoading(true);

    if (MAP_KEY === "YOUR_MAP_KEY_HERE") {
      setTimeout(() => {
        const demoData = generateDemoData(150, [w, s, e, n]);
        renderFireMarkers(demoData);
        showLoading(false);
      }, 1000);
      return;
    }

    try {
      const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${MAP_KEY}/${sensor}/${bbox}/${days}`;

      const response = await fetch(url);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const csv = await response.text();

      if (csv.includes("Invalid")) {
        console.warn("API error:", csv);
        throw new Error(csv);
      }

      const data = parseCSV(csv);
      console.log("Fires loaded:", data.length);

      data.sort((a, b) => (parseFloat(b.frp) || 0) - (parseFloat(a.frp) || 0));

      renderFireMarkers(data);
    } catch (error) {
      console.error("Fetch error:", error);
      const demoData = generateDemoData(150, [w, s, e, n]);
      renderFireMarkers(demoData);
      alert("API request failed. Showing demo data. Error: " + error.message);
    } finally {
      showLoading(false);
    }
  }

  function generateDemoData(count, bounds) {
    const [w, s, e, n] = bounds;
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

  const regionPresets = {
    world: { w: -180, s: -90, e: 180, n: 90, center: [20, 0], zoom: 2 },
    usa: { w: -125, s: 25, e: -65, n: 50, center: [39, -98], zoom: 4 },
    california: {
      w: -125,
      s: 32,
      e: -114,
      n: 42,
      center: [37, -120],
      zoom: 6,
    },
    australia: {
      w: 112,
      s: -44,
      e: 154,
      n: -10,
      center: [-25, 135],
      zoom: 4,
    },
    amazon: { w: -75, s: -20, e: -45, n: 5, center: [-8, -60], zoom: 5 },
    africa: { w: 10, s: -15, e: 40, n: 15, center: [0, 25], zoom: 4 },
  };

  document
    .getElementById("regionPreset")
    .addEventListener("change", function () {
      const preset = regionPresets[this.value];
      if (preset) {
        document.getElementById("bboxW").value = preset.w;
        document.getElementById("bboxS").value = preset.s;
        document.getElementById("bboxE").value = preset.e;
        document.getElementById("bboxN").value = preset.n;
        map.setView(preset.center, preset.zoom);
      }
    });

  map.on("moveend", function () {
    const bounds = map.getBounds();
    document.getElementById("bboxW").value = bounds.getWest().toFixed(2);
    document.getElementById("bboxS").value = bounds.getSouth().toFixed(2);
    document.getElementById("bboxE").value = bounds.getEast().toFixed(2);
    document.getElementById("bboxN").value = bounds.getNorth().toFixed(2);
  });

  setTimeout(fetchFireData, 500);
});
