/* RESCUE-X Search & Rescue Rover Telemetry & Control System */

// --- Global Application State ---
const state = {
  layoutMode: 'phone', // 'phone' or 'grid'
  eStop: false,
  
  // Telemetry feeds
  sim: {
    humanDetected: true,
    humanConfidence: 94,
    gasPpm: 142,
    gasHazard: false,
    aqi: 28,
    aqiStatus: 'GOOD',
    temp: 31.2,
    ldr: 340,
    dist: { front: 82, left: 35, right: 120, rear: 95 },
    mpu: { roll: 7, pitch: 3, yaw: 124 },
    vitals: { hr: 78, rr: 16, radarConf: 96 },
    audio: { level: 48, event: 'AMBIENT SAFE', dir: 45 },
    drive: { direction: 'STOP', speed: 1.4, mode: 'AUTONOMOUS', throttle: 60, headlights: false },
    gps: { lat: 12.9716, lon: 77.5946, sats: 11, distStart: 12.4 },
    battery: { pct: 82, volts: 12.4, current: 1.8 },
    comms: { wifi: 94, drop: false }
  },

  camera: {
    nv: false,
    recording: true,
    humanX: 340,
    humanY: 180,
    boxDx: 1.2,
    boxDy: 0.8
  }
};

// Web Audio API Audio Context & Sirens
let audioCtx = null;
let sirenOsc = null;
let sirenGain = null;
let sirenInterval = null;

// Leaflet Map Global Objects
let map = null;
let roverMarker = null;
let trailPolyline = null;
let pathCoords = [];

// Initialize Dashboard on Page Load
window.addEventListener('DOMContentLoaded', () => {
  initMap();
  initCanvasVisualizers();
  startTelemetryLoop();
  updateUI();
});

// --- 1. Layout Mode Switcher (Phone Shell vs Dashboard Grid) ---
function toggleLayoutMode() {
  const wrapper = document.getElementById('viewWrapper');
  const main = document.getElementById('mainContainer');
  const content = document.getElementById('contentLayout');
  const viewIcon = document.getElementById('viewIcon');
  const viewText = document.getElementById('viewText');

  if (state.layoutMode === 'phone') {
    state.layoutMode = 'grid';
    wrapper.classList.remove('phone-mode-wrapper');
    main.classList.remove('phone-shell');
    content.classList.remove('phone-content');
    content.classList.add('dashboard-grid');

    // Rearrange cards into desktop grid layout
    applyDesktopGridSpans();

    viewIcon.textContent = '🖥️';
    viewText.textContent = 'Dashboard Grid';
  } else {
    state.layoutMode = 'phone';
    wrapper.classList.add('phone-mode-wrapper');
    main.classList.add('phone-shell');
    content.classList.add('phone-content');
    content.classList.remove('dashboard-grid');

    resetMobileSpans();

    viewIcon.textContent = '📱';
    viewText.textContent = 'Phone Shell';
  }

  // Refresh Leaflet Map size after layout change
  setTimeout(() => {
    if (map) map.invalidateSize();
  }, 300);
}

function applyDesktopGridSpans() {
  const cards = document.querySelectorAll('.hud-card');
  cards.forEach((card, idx) => {
    card.classList.remove('col-12', 'col-8', 'col-6', 'col-4', 'col-3');
    // Specific grid layout for full-screen mission control
    if (idx === 0) card.classList.add('col-8');       // Camera Feed
    else if (idx === 1) card.classList.add('col-4');  // Laptop AI Tracker & Map
    else if (idx === 2) card.classList.add('col-4');  // Vitals Radar
    else if (idx === 3) card.classList.add('col-4');  // Audio Spectrum
    else if (idx === 4) card.classList.add('col-4');  // Fusion Engine
    else if (idx === 5) card.classList.add('col-4');  // Hazard/Gas Feed
    else if (idx === 6) card.classList.add('col-4');  // Environment
    else if (idx === 7) card.classList.add('col-4');  // Distance Radar
    else if (idx === 8) card.classList.add('col-4');  // Orientation
    else if (idx === 9) card.classList.add('col-4');  // Movement Nav
    else if (idx === 10) card.classList.add('col-8'); // GPS Map View
    else if (idx === 11) card.classList.add('col-4'); // Tele-op Controls
  });
}

function resetMobileSpans() {
  const cards = document.querySelectorAll('.hud-card');
  cards.forEach(card => {
    card.classList.remove('col-12', 'col-8', 'col-6', 'col-4', 'col-3');
  });
}

// --- 2. Leaflet GPS Map Setup ---
function initMap() {
  const defaultPos = [12.9716, 77.5946];
  pathCoords = [defaultPos];

  map = L.map('gpsMap', {
    center: defaultPos,
    zoom: 17,
    zoomControl: false,
    attributionControl: false
  });

  // Dark Tactical Map Tiles (CartoDB Dark Matter)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    subdomains: 'abcd'
  }).addTo(map);

  // Custom Animated Rover Icon
  const roverIcon = L.divIcon({
    className: 'custom-rover-marker',
    html: `<div style="
      width: 28px; height: 28px;
      background: rgba(0, 240, 255, 0.2);
      border: 2px solid #00f0ff;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 15px #00f0ff;
      font-size: 14px;
      transform: rotate(0deg);
      transition: transform 0.3s ease;
      id="roverMarkerIcon"
    ">🤖</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });

  roverMarker = L.marker(defaultPos, { icon: roverIcon }).addTo(map);

  // Path polyline
  trailPolyline = L.polyline(pathCoords, {
    color: '#00f0ff',
    weight: 3,
    dashArray: '5, 8',
    opacity: 0.8
  }).addTo(map);
}

function updateRoverMapPosition(lat, lon) {
  if (!map || !roverMarker) return;
  const newPos = [lat, lon];
  roverMarker.setLatLng(newPos);

  pathCoords.push(newPos);
  if (pathCoords.length > 50) pathCoords.shift();
  trailPolyline.setLatLngs(pathCoords);

  map.panTo(newPos, { animate: true, duration: 0.5 });
}

// --- 3. HTML5 Canvas Telemetry Renderers ---
function initCanvasVisualizers() {
  requestAnimationFrame(renderLoop);
}

let ecgX = 0;
let radarAngle = 0;

function renderLoop() {
  renderCameraFeed();
  renderEcgGraph();
  renderAudioSpectrum();
  renderOrientationHorizon();
  renderDistanceRadar();

  requestAnimationFrame(renderLoop);
}

// 🎥 A) Simulated Camera AI Feed Canvas
function renderCameraFeed() {
  const canvas = document.getElementById('cameraCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  // Clear Canvas
  ctx.fillStyle = state.camera.nv ? '#001a0a' : '#050914';
  ctx.fillRect(0, 0, w, h);

  // Simulated background environment shapes (ruins / rubble)
  ctx.strokeStyle = state.camera.nv ? 'rgba(0, 255, 100, 0.15)' : 'rgba(0, 240, 255, 0.1)';
  ctx.lineWidth = 1;

  // Grid scan lines
  for (let x = 0; x < w; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y < h; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  // Move bounding box if human detected
  if (state.sim.humanDetected) {
    state.camera.humanX += state.camera.boxDx;
    state.camera.humanY += state.camera.boxDy;

    if (state.camera.humanX > w - 120 || state.camera.humanX < 40) state.camera.boxDx *= -1;
    if (state.camera.humanY > h - 140 || state.camera.humanY < 40) state.camera.boxDy *= -1;

    const bx = state.camera.humanX;
    const by = state.camera.humanY;
    const bw = 100;
    const bh = 140;

    // Draw Victim Bounding Box
    ctx.strokeStyle = state.camera.nv ? '#00ff88' : '#00f0ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, bw, bh);

    // Box Corners Glow
    const cornerSize = 12;
    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 3;
    // Top-left
    ctx.beginPath(); ctx.moveTo(bx, by + cornerSize); ctx.lineTo(bx, by); ctx.lineTo(bx + cornerSize, by); ctx.stroke();
    // Top-right
    ctx.beginPath(); ctx.moveTo(bx + bw - cornerSize, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + cornerSize); ctx.stroke();
    // Bottom-left
    ctx.beginPath(); ctx.moveTo(bx, by + bh - cornerSize); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + cornerSize, by + bh); ctx.stroke();
    // Bottom-right
    ctx.beginPath(); ctx.moveTo(bx + bw - cornerSize, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by + bh - cornerSize); ctx.stroke();

    // AI Tag Label
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(bx, by - 24, 140, 22);
    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 11px JetBrains Mono';
    ctx.fillText(`👤 HUMAN [${state.sim.humanConfidence}%]`, bx + 6, by - 8);

    // Dynamic silhouette shape inside box
    ctx.fillStyle = state.camera.nv ? 'rgba(0, 255, 136, 0.25)' : 'rgba(0, 240, 255, 0.2)';
    ctx.beginPath();
    ctx.arc(bx + bw / 2, by + 35, 18, 0, Math.PI * 2); // Head
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(bx + bw / 2, by + 90, 25, 35, 0, 0, Math.PI * 2); // Body
    ctx.fill();
  }

  // HUD Center Crosshair
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(w / 2 - 20, h / 2); ctx.lineTo(w / 2 + 20, h / 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(w / 2, h / 2 - 20); ctx.lineTo(w / 2, h / 2 + 20); ctx.stroke();
  ctx.beginPath(); ctx.arc(w / 2, h / 2, 10, 0, Math.PI * 2); ctx.stroke();

  // Night Vision Noise overlay
  if (state.camera.nv) {
    ctx.fillStyle = 'rgba(0, 255, 100, 0.04)';
    ctx.fillRect(0, 0, w, h);
  }
}

// ❤️ B) Vitals 60GHz Radar ECG Pulse Graph Canvas
const ecgHistory = new Array(200).fill(45);

function renderEcgGraph() {
  const canvas = document.getElementById('ecgCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  // Compute next ECG point based on simulated Heart Rate
  ecgX = (ecgX + 1) % 40;
  let sample = 45;

  if (state.sim.humanDetected) {
    if (ecgX === 10) sample = 25;       // P Wave
    else if (ecgX === 16) sample = 80;  // Q dip
    else if (ecgX === 18) sample = 10;  // R Peak
    else if (ecgX === 20) sample = 85;  // S dip
    else if (ecgX === 28) sample = 35;  // T Wave
  } else {
    // Low flat line noise when no victim
    sample = 45 + (Math.random() * 4 - 2);
  }

  ecgHistory.push(sample);
  if (ecgHistory.length > w) ecgHistory.shift();

  // Draw Grid Lines
  ctx.fillStyle = '#03080e';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(0, 255, 136, 0.1)';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 20) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y < h; y += 20) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  // Draw Line
  ctx.strokeStyle = state.sim.humanDetected ? '#00ff88' : '#64748b';
  ctx.lineWidth = 2;
  ctx.shadowColor = state.sim.humanDetected ? '#00ff88' : 'transparent';
  ctx.shadowBlur = 8;

  ctx.beginPath();
  for (let i = 0; i < ecgHistory.length; i++) {
    const x = i;
    const y = ecgHistory[i];
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
}

// 🎤 C) Audio Spectrum Frequency Canvas
function renderAudioSpectrum() {
  const canvas = document.getElementById('audioCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = '#04060c';
  ctx.fillRect(0, 0, w, h);

  const bars = 32;
  const barWidth = w / bars;

  for (let i = 0; i < bars; i++) {
    let barHeight = Math.random() * (state.sim.audio.level * 0.7);
    if (state.sim.humanDetected && i > 10 && i < 22) {
      // Voice / distress cry frequency boost
      barHeight += Math.random() * 30 + 15;
    }

    const x = i * barWidth;
    const y = h - barHeight;

    const grad = ctx.createLinearGradient(0, h, 0, 0);
    grad.addColorStop(0, '#00f0ff');
    grad.addColorStop(0.7, '#a855f7');
    grad.addColorStop(1, '#ff2a5f');

    ctx.fillStyle = grad;
    ctx.fillRect(x + 1, y, barWidth - 2, barHeight);
  }
}

// 🧭 D) MPU6050 Orientation Horizon Canvas Gauge
function renderOrientationHorizon() {
  const canvas = document.getElementById('horizonCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;

  ctx.fillStyle = '#040810';
  ctx.fillRect(0, 0, w, h);

  const rollRad = (state.sim.mpu.roll * Math.PI) / 180;
  const pitchOffset = state.sim.mpu.pitch * 2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rollRad);

  // Ground / Sky Split Line
  ctx.fillStyle = 'rgba(0, 240, 255, 0.15)'; // Sky
  ctx.fillRect(-w, -h + pitchOffset, w * 2, h);

  ctx.fillStyle = 'rgba(168, 85, 247, 0.15)'; // Ground
  ctx.fillRect(-w, 0 + pitchOffset, w * 2, h);

  // Horizon Line
  ctx.strokeStyle = state.sim.mpu.roll > 25 || state.sim.mpu.roll < -25 ? '#ff2a5f' : '#00f0ff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-cx + 20, pitchOffset);
  ctx.lineTo(cx - 20, pitchOffset);
  ctx.stroke();

  // Pitch Ladder Lines
  for (let p = -30; p <= 30; p += 10) {
    if (p === 0) continue;
    const ly = pitchOffset - p * 2;
    ctx.beginPath();
    ctx.moveTo(-20, ly);
    ctx.lineTo(20, ly);
    ctx.stroke();
  }

  ctx.restore();

  // Fixed Center Reticle Aircraft Marker
  ctx.strokeStyle = '#ffaa00';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 30, cy); ctx.lineTo(cx - 10, cy); ctx.lineTo(cx - 10, cy + 8);
  ctx.moveTo(cx + 30, cy); ctx.lineTo(cx + 10, cy); ctx.lineTo(cx + 10, cy + 8);
  ctx.moveTo(cx - 4, cy); ctx.lineTo(cx + 4, cy);
  ctx.stroke();
}

// 📏 E) 360-Degree Distance Sonar Radar Canvas
function renderDistanceRadar() {
  const canvas = document.getElementById('radarCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const maxR = Math.min(cx, cy) - 10;

  ctx.fillStyle = '#02070d';
  ctx.fillRect(0, 0, w, h);

  // Concentric Radar Rings
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
  ctx.lineWidth = 1;
  for (let r = maxR / 3; r <= maxR; r += maxR / 3) {
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  }

  // Cross axes
  ctx.beginPath(); ctx.moveTo(cx - maxR, cy); ctx.lineTo(cx + maxR, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy - maxR); ctx.lineTo(cx, cy + maxR); ctx.stroke();

  // Rotating Sweep Line
  radarAngle = (radarAngle + 0.04) % (Math.PI * 2);
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(radarAngle) * maxR, cy + Math.sin(radarAngle) * maxR);
  ctx.stroke();

  // Draw 4 Proximity Obstacle Target Dots (FRONT, LEFT, RIGHT, REAR)
  const d = state.sim.dist;
  const targets = [
    { name: 'FRONT', dist: d.front, angle: -Math.PI / 2 },
    { name: 'REAR',  dist: d.rear,  angle: Math.PI / 2 },
    { name: 'LEFT',  dist: d.left,  angle: Math.PI },
    { name: 'RIGHT', dist: d.right, angle: 0 }
  ];

  targets.forEach(t => {
    const normR = Math.min(1, t.dist / 150) * maxR;
    const tx = cx + Math.cos(t.angle) * normR;
    const ty = cy + Math.sin(t.angle) * normR;

    ctx.fillStyle = t.dist < 30 ? '#ff2a5f' : (t.dist < 50 ? '#ffaa00' : '#00ff88');
    ctx.beginPath();
    ctx.arc(tx, ty, 5, 0, Math.PI * 2);
    ctx.fill();

    // Pulse aura for close obstacles
    if (t.dist < 50) {
      ctx.strokeStyle = ctx.fillStyle;
      ctx.beginPath();
      ctx.arc(tx, ty, 9, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
}

// --- 4. Main Telemetry Loop & Periodic Updates ---
function startTelemetryLoop() {
  setInterval(() => {
    if (state.eStop) return;

    // Small realistic sensor fluctuations
    if (!state.sim.gasHazard) {
      state.sim.gasPpm = 135 + Math.floor(Math.random() * 15);
    }

    state.sim.temp = (31.0 + Math.random() * 0.4).toFixed(1);
    state.sim.vitals.hr = state.sim.humanDetected ? 76 + Math.floor(Math.random() * 6) : 0;
    state.sim.audio.level = 42 + Math.floor(Math.random() * 12);

    // Rover GPS movement when driving
    if (state.sim.drive.direction !== 'STOP') {
      state.sim.drive.speed = (state.sim.drive.throttle / 100 * 2.2).toFixed(1);
      state.sim.gps.distStart = (parseFloat(state.sim.gps.distStart) + 0.05).toFixed(1);

      // Slightly alter coordinates
      const deltaLat = (Math.random() - 0.5) * 0.00008;
      const deltaLon = (Math.random() - 0.5) * 0.00008;
      state.sim.gps.lat = (parseFloat(state.sim.gps.lat) + deltaLat).toFixed(4);
      state.sim.gps.lon = (parseFloat(state.sim.gps.lon) + deltaLon).toFixed(4);

      updateRoverMapPosition(state.sim.gps.lat, state.sim.gps.lon);
    } else {
      state.sim.drive.speed = 0.0;
    }

    updateUI();
  }, 1000);
}

// Update DOM elements with current telemetry values
function updateUI() {
  const s = state.sim;

  // Header Values
  document.getElementById('headerBatteryVal').textContent = `${s.battery.pct}% (${s.battery.volts}V)`;
  document.getElementById('headerModeVal').textContent = s.drive.mode;

  if (s.comms.drop) {
    document.getElementById('commsDot').className = 'status-dot danger';
    document.getElementById('commsText').textContent = 'DISCONNECTED';
  } else {
    document.getElementById('commsDot').className = 'status-dot';
    document.getElementById('commsText').textContent = `Wi-Fi (${s.comms.wifi}%)`;
  }

  // Vitals
  document.getElementById('hrVal').innerHTML = `${s.vitals.hr} <span style="font-size:0.65rem; font-weight:normal;">BPM</span>`;
  document.getElementById('rrVal').innerHTML = `${s.vitals.rr} <span style="font-size:0.65rem; font-weight:normal;">BPM</span>`;
  document.getElementById('radarConfVal').textContent = `${s.vitals.radarConf}%`;

  // Audio
  document.getElementById('soundLevelVal').textContent = `${s.audio.level} dB`;
  document.getElementById('soundEventVal').textContent = s.audio.event;
  document.getElementById('soundDirVal').textContent = `${s.audio.dir}° NE`;

  // Fused Human Detection
  const fusionBadge = document.getElementById('fusionStatusBadge');
  if (s.humanDetected) {
    fusionBadge.className = 'card-badge active';
    fusionBadge.textContent = 'HUMAN DETECTED';
    document.getElementById('fusionCamText').textContent = 'Detected';
    document.getElementById('fusionCamText').style.color = 'var(--vital-green)';
    document.getElementById('fusionRadarText').textContent = 'Present';
    document.getElementById('fusionRadarText').style.color = 'var(--vital-green)';
    document.getElementById('fusionPirText').textContent = 'Active Motion';
    document.getElementById('fusionPirText').style.color = 'var(--vital-green)';
    document.getElementById('fusionScoreVal').textContent = `${s.humanConfidence}% (HIGH)`;
    document.getElementById('fusionBarFill').style.width = `${s.humanConfidence}%`;
  } else {
    fusionBadge.className = 'card-badge';
    fusionBadge.textContent = 'NO HUMAN DETECTED';
    document.getElementById('fusionCamText').textContent = 'None';
    document.getElementById('fusionCamText').style.color = 'var(--text-muted)';
    document.getElementById('fusionRadarText').textContent = 'Clear';
    document.getElementById('fusionRadarText').style.color = 'var(--text-muted)';
    document.getElementById('fusionPirText').textContent = 'Inactive';
    document.getElementById('fusionPirText').style.color = 'var(--text-muted)';
    document.getElementById('fusionScoreVal').textContent = '0%';
    document.getElementById('fusionBarFill').style.width = '0%';
  }

  // Laptop AI Human Tracker Card
  const trackerBadge = document.getElementById('trackerStatusBadge');
  if (trackerBadge) {
    if (s.humanDetected) {
      trackerBadge.className = 'card-badge active';
      trackerBadge.textContent = 'TARGET LOCKED';
      if (document.getElementById('trackerDistVal')) document.getElementById('trackerDistVal').textContent = '4.5 m';
      if (document.getElementById('trackerBearingVal')) document.getElementById('trackerBearingVal').textContent = '45° NE';
      if (document.getElementById('trackerOffsetVal')) document.getElementById('trackerOffsetVal').textContent = 'X:2.4m | Y:3.8m';
      if (document.getElementById('trackerGpsVal')) document.getElementById('trackerGpsVal').textContent = `${(parseFloat(s.gps.lat) + 0.00004).toFixed(5)}° N, ${(parseFloat(s.gps.lon) + 0.00003).toFixed(5)}° E`;
    } else {
      trackerBadge.className = 'card-badge';
      trackerBadge.textContent = 'SEARCHING';
      if (document.getElementById('trackerDistVal')) document.getElementById('trackerDistVal').textContent = '-- m';
      if (document.getElementById('trackerBearingVal')) document.getElementById('trackerBearingVal').textContent = '--°';
      if (document.getElementById('trackerOffsetVal')) document.getElementById('trackerOffsetVal').textContent = 'X:0.0m | Y:0.0m';
      if (document.getElementById('trackerGpsVal')) document.getElementById('trackerGpsVal').textContent = `${s.gps.lat}° N, ${s.gps.lon}° E`;
    }
  }

  // Gas / Hazard Feed
  document.getElementById('gasPpmVal').innerHTML = `${s.gasPpm} <span style="font-size:0.7rem; color:var(--text-muted);">PPM</span>`;
  document.getElementById('aqiVal').textContent = `${s.aqiStatus} (AQI ${s.aqi})`;
  const gasAlertBanner = document.getElementById('gasAlertBanner');
  const gasBadge = document.getElementById('gasBadge');

  if (s.gasHazard) {
    gasAlertBanner.style.display = 'flex';
    gasBadge.className = 'card-badge danger';
    gasBadge.textContent = 'HAZARD ALARM';
    document.getElementById('aqiVal').style.color = 'var(--hazard-red)';
  } else {
    gasAlertBanner.style.display = 'none';
    gasBadge.className = 'card-badge active';
    gasBadge.textContent = 'AIR QUALITY SAFE';
    document.getElementById('aqiVal').style.color = 'var(--vital-green)';
  }

  // Environment Temp & LDR
  document.getElementById('envTempVal').textContent = `${s.temp} °C`;
  document.getElementById('ldrVal').textContent = `${s.ldr} LUX`;

  // Distance Sensors
  document.getElementById('distFrontVal').textContent = `${s.dist.front} cm`;
  document.getElementById('distLeftVal').textContent = `${s.dist.left} cm`;
  document.getElementById('distRightVal').textContent = `${s.dist.right} cm`;
  document.getElementById('distRearVal').textContent = `${s.dist.rear} cm`;

  updateDistanceCardStatus('distFrontCard', s.dist.front);
  updateDistanceCardStatus('distLeftCard', s.dist.left);
  updateDistanceCardStatus('distRightCard', s.dist.right);
  updateDistanceCardStatus('distRearCard', s.dist.rear);

  // MPU Orientation Angles
  document.getElementById('rollVal').textContent = `${s.mpu.roll}°`;
  document.getElementById('pitchVal').textContent = `${s.mpu.pitch}°`;
  document.getElementById('yawVal').textContent = `${s.mpu.yaw}°`;

  // Movement Telemetry
  document.getElementById('speedVal').innerHTML = `${s.drive.speed} <span style="font-size:0.6rem;">m/s</span>`;
  document.getElementById('odometerVal').innerHTML = `${s.gps.distStart} <span style="font-size:0.6rem;">m</span>`;

  // GPS Coordinates
  document.getElementById('latVal').textContent = `${s.gps.lat}° N`;
  document.getElementById('lonVal').textContent = `${s.gps.lon}° E`;
}

function updateDistanceCardStatus(cardId, distVal) {
  const card = document.getElementById(cardId);
  if (!card) return;
  if (distVal < 40) {
    card.className = 'dist-card warning';
  } else {
    card.className = 'dist-card';
  }
}

// --- 5. Tele-operation Drive Controls & Sound Effects ---
function sendDriveCmd(direction) {
  if (state.eStop) return;
  state.sim.drive.direction = direction;

  // Highlight active dpad button
  const btns = ['btnFwd', 'btnLeft', 'btnRight', 'btnRev', 'btnStop'];
  btns.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });

  if (direction === 'FORWARD') document.getElementById('btnFwd').classList.add('active');
  else if (direction === 'LEFT') document.getElementById('btnLeft').classList.add('active');
  else if (direction === 'RIGHT') document.getElementById('btnRight').classList.add('active');
  else if (direction === 'REVERSE') document.getElementById('btnRev').classList.add('active');
  else if (direction === 'STOP') document.getElementById('btnStop').classList.add('active');
}

function updateSpeedThrottle(val) {
  state.sim.drive.throttle = parseInt(val);
  document.getElementById('throttleLabel').textContent = `${val}%`;
}

function toggleDriveMode() {
  const modeBtnText = document.getElementById('driveModeBtnText');
  const badge = document.getElementById('driveModeBadge');

  if (state.sim.drive.mode === 'AUTONOMOUS') {
    state.sim.drive.mode = 'MANUAL DRIVE';
    modeBtnText.textContent = 'Switch to Autonomous';
    badge.textContent = 'MANUAL ENGAGED';
  } else {
    state.sim.drive.mode = 'AUTONOMOUS';
    modeBtnText.textContent = 'Switch to Manual';
    badge.textContent = 'AUTONOMOUS ACTIVE';
  }
  updateUI();
}

function toggleHeadlights() {
  state.sim.drive.headlights = !state.sim.drive.headlights;
  const btn = document.getElementById('headlightsBtn');
  btn.textContent = `💡 Headlights: ${state.sim.drive.headlights ? 'ON' : 'OFF'}`;
  btn.style.color = state.sim.drive.headlights ? 'var(--warning-amber)' : 'var(--text-main)';
}

// Web Audio API Horn Synthesizer
function playHornSound() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'square';
    osc1.frequency.value = 440; // A4
    osc2.frequency.value = 554.37; // C#5

    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(audioCtx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(audioCtx.currentTime + 0.4);
    osc2.stop(audioCtx.currentTime + 0.4);
  } catch (e) {
    console.log('Audio Context error:', e);
  }
}

// Emergency Hazard Siren Synthesizer
function startSirenSound() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (sirenOsc) return;

    sirenOsc = audioCtx.createOscillator();
    sirenGain = audioCtx.createGain();

    sirenOsc.type = 'sine';
    sirenOsc.frequency.setValueAtTime(600, audioCtx.currentTime);

    sirenGain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    sirenOsc.connect(sirenGain);
    sirenGain.connect(audioCtx.destination);

    sirenOsc.start();

    let high = false;
    sirenInterval = setInterval(() => {
      if (!sirenOsc) return;
      sirenOsc.frequency.setValueAtTime(high ? 600 : 900, audioCtx.currentTime);
      high = !high;
    }, 400);
  } catch (e) {}
}

function stopSirenSound() {
  if (sirenInterval) clearInterval(sirenInterval);
  if (sirenOsc) {
    try {
      sirenOsc.stop();
      sirenOsc.disconnect();
    } catch (e) {}
    sirenOsc = null;
  }
}

// Camera Helper Controls
function toggleNightVision() {
  state.camera.nv = !state.camera.nv;
  document.getElementById('nvLabel').textContent = state.camera.nv ? 'Normal Color' : 'Night Vision';
}

function takeSnapshot() {
  alert('📸 Snapshot captured to local storage!');
}

function toggleRecord() {
  state.camera.recording = !state.camera.recording;
  document.getElementById('recLabel').textContent = state.camera.recording ? 'Record' : 'Stopped';
}

// --- 6. Emergency Stop System ---
function triggerEmergencyStop() {
  state.eStop = true;
  state.sim.drive.direction = 'STOP';
  state.sim.drive.speed = 0;

  startSirenSound();

  const estopBanner = document.querySelector('.big-estop-banner');
  estopBanner.style.background = '#ff2a5f';
  estopBanner.textContent = '🛑 EMERGENCY STOP ACTIVATED — TAP TO RESET';

  estopBanner.onclick = resetEmergencyStop;
  alert('🚨 EMERGENCY STOP TRIGGERED!\nMotors locked, hazard siren engaged.');
}

function resetEmergencyStop() {
  state.eStop = false;
  stopSirenSound();

  const estopBanner = document.querySelector('.big-estop-banner');
  estopBanner.style.background = 'linear-gradient(135deg, #cc0029, #80001a)';
  estopBanner.textContent = '🛑 EMERGENCY STOP';
  estopBanner.onclick = triggerEmergencyStop;
}

// --- 7. Scenario Simulator Triggers ---
function simToggleHuman() {
  state.sim.humanDetected = !state.sim.humanDetected;
  document.getElementById('simHumanBtn').classList.toggle('active', state.sim.humanDetected);
  if (state.sim.humanDetected) {
    state.sim.audio.event = 'DISTRESS CRY DETECTED';
    state.sim.vitals.hr = 84;
  } else {
    state.sim.audio.event = 'AMBIENT SAFE';
    state.sim.vitals.hr = 0;
  }
  updateUI();
}

function simToggleGas() {
  state.sim.gasHazard = !state.sim.gasHazard;
  document.getElementById('simGasBtn').classList.toggle('active', state.sim.gasHazard);

  if (state.sim.gasHazard) {
    state.sim.gasPpm = 850;
    state.sim.aqi = 184;
    state.sim.aqiStatus = 'UNHEALTHY / DANGER';
    startSirenSound();
  } else {
    state.sim.gasPpm = 142;
    state.sim.aqi = 28;
    state.sim.aqiStatus = 'GOOD';
    stopSirenSound();
  }
  updateUI();
}

function simToggleObstacle() {
  const isDanger = state.sim.dist.front < 30;
  document.getElementById('simObstacleBtn').classList.toggle('active', !isDanger);

  if (!isDanger) {
    state.sim.dist.front = 18; // Close obstacle
    state.sim.dist.left = 22;
  } else {
    state.sim.dist.front = 82;
    state.sim.dist.left = 35;
  }
  updateUI();
}

function simToggleTilt() {
  const isRollover = state.sim.mpu.roll > 25;
  document.getElementById('simTiltBtn').classList.toggle('active', !isRollover);

  if (!isRollover) {
    state.sim.mpu.roll = 38; // Rollover angle
    state.sim.mpu.pitch = 14;
    alert('🧭 WARNING: Rollover tilt threshold exceeded! (>35°)');
  } else {
    state.sim.mpu.roll = 7;
    state.sim.mpu.pitch = 3;
  }
  updateUI();
}

function simToggleComms() {
  state.sim.comms.drop = !state.sim.comms.drop;
  document.getElementById('simCommsBtn').classList.toggle('active', state.sim.comms.drop);
  updateUI();
}

function simResetAll() {
  state.eStop = false;
  stopSirenSound();

  state.sim.humanDetected = true;
  state.sim.gasHazard = false;
  state.sim.gasPpm = 142;
  state.sim.aqi = 28;
  state.sim.aqiStatus = 'GOOD';
  state.sim.dist = { front: 82, left: 35, right: 120, rear: 95 };
  state.sim.mpu = { roll: 7, pitch: 3, yaw: 124 };
  state.sim.comms.drop = false;

  const simBtns = document.querySelectorAll('.sim-btn');
  simBtns.forEach(btn => btn.classList.remove('active'));

  resetEmergencyStop();
  updateUI();
}
