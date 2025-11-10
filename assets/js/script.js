document.addEventListener("DOMContentLoaded", async () => {
  console.log("📡 Chargement du module Structures — Drone Lands");

  const JSON_URL = "/api/manage_structures.php";

  // === Sélecteurs DOM ===
  const regionFilter = document.getElementById("regionFilter");
  const typeFilter = document.getElementById("typeFilter");
  const allianceFilter = document.getElementById("allianceFilter");
  const constellationFilter = document.getElementById("constellationFilter");
  const reinforcedFilter = document.getElementById("reinforcedFilter");
  const searchInput = document.getElementById("searchInput");
  const resetBtn = document.getElementById("resetFilters");
  const tableBody = document.getElementById("tableBody");
  const counter = document.getElementById("counter");

  let allStructures = [];

  // === Charger les données ===
  async function loadData() {
    try {
      const res = await fetch(`${JSON_URL}?v=${Date.now()}`);
      const json = await res.json();
      allStructures = json.structures || [];
      renderTable(allStructures);
      populateFilters();
      console.log(`✅ ${allStructures.length} structures chargées.`);
    } catch (e) {
      console.error("Erreur de chargement :", e);
      tableBody.innerHTML = `<tr><td colspan="9">❌ Impossible de charger les données</td></tr>`;
    }
  }

  // === Filtres dynamiques ===
  function populateFilters() {
    const uniques = (key) => [...new Set(allStructures.map(s => s[key] || "Inconnu"))].sort();

    function fillSelect(select, items, label) {
      if (!select) return;
      select.innerHTML = `<option value="">${label}</option>`;
      items.forEach(i => {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = i;
        select.appendChild(opt);
      });
    }

    fillSelect(regionFilter, uniques("Région"), "🌍 Toutes régions");
    fillSelect(typeFilter, uniques("Type"), "🏗️ Tous types");
    fillSelect(allianceFilter, uniques("Alliance / Corporation"), "🛡️ Toutes alliances");
    fillSelect(constellationFilter, uniques("Constellation"), "🌌 Toutes constellations");
  }

  // === Filtrage ===
  function applyFilters() {
    let filtered = [...allStructures];
    const region = regionFilter.value;
    const type = typeFilter.value;
    const alliance = allianceFilter.value;
    const constellation = constellationFilter.value;
    const search = searchInput.value.trim().toLowerCase();

    if (region) filtered = filtered.filter(s => s["Région"] === region);
    if (type) filtered = filtered.filter(s => s["Type"] === type);
    if (alliance) filtered = filtered.filter(s => s["Alliance / Corporation"] === alliance);
    if (constellation) filtered = filtered.filter(s => s["Constellation"] === constellation);
    if (search)
      filtered = filtered.filter(s =>
        Object.values(s).some(v => v?.toString().toLowerCase().includes(search))
      );

    renderTable(filtered);
  }

  [regionFilter, typeFilter, allianceFilter, constellationFilter].forEach(f =>
    f?.addEventListener("change", applyFilters)
  );
  searchInput?.addEventListener("input", applyFilters);
  resetBtn?.addEventListener("click", () => {
    [regionFilter, typeFilter, allianceFilter, constellationFilter, searchInput].forEach(el => {
      if (el) el.value = "";
    });
    renderTable(allStructures);
  });

  // === Compte à rebours ===
  function formatCountdown(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const d = Math.floor(totalSeconds / 86400);
    const h = Math.floor((totalSeconds % 86400) / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return d > 0
      ? `${d}d ${h.toString().padStart(2, "0")}h ${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`
      : `${h}h ${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`;
  }

  function renderTable(structures) {
    if (!structures.length) {
      tableBody.innerHTML = `<tr><td colspan="9">Aucune structure trouvée</td></tr>`;
      counter.textContent = "Total : 0";
      return;
    }

    tableBody.innerHTML = "";
    structures.forEach(s => {
      const system = s["Nom du système"] || "-";
      const structureName = s["Nom de la structure"] || s["Remarques"] || "-";
      const date = s["Date"];
      let countdownHTML = "-";

      if (date && !isNaN(new Date(date))) {
        const target = new Date(date);
        const diff = target - new Date();
        countdownHTML = diff > 0
          ? `<span class="countdown" data-target="${target.toISOString()}">${formatCountdown(diff)}</span>`
          : `<span class="expired">❌</span>`;
      }

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${system}</td>
        <td>${structureName}</td>
        <td>${s["Région"] || "-"}</td>
        <td>${s["Constellation"] || "-"}</td>
        <td>${s["Type"] || "-"}</td>
        <td>${s["Alliance / Corporation"] || "-"}</td>
        <td>${date || "-"}</td>
        <td>${countdownHTML}</td>
      `;
      tableBody.appendChild(tr);
    });

    counter.textContent = `Total : ${structures.length}`;
  }

  setInterval(() => {
    document.querySelectorAll(".countdown").forEach(el => {
      const t = new Date(el.dataset.target);
      const diff = t - new Date();
      if (diff <= 0) {
        el.textContent = "❌";
        el.className = "expired";
      } else el.textContent = formatCountdown(diff);
    });
  }, 1000);

  await loadData();
  await initStrategicMap(allStructures);
});


// === 🗺️ Carte stratégique ===
async function initStrategicMap(structures) {
  console.log("🗺️ Initialisation de la carte stratégique (version sans redirection)...");

  const mapContainer = document.getElementById("strategicMap");
  const timersList = document.getElementById("mapTimersList");
  const regionTitle = document.getElementById("mapRegionTitle");
  const backButton = document.getElementById("mapBackButton");

  if (!mapContainer) return;

  let currentLevel = "universe";
  let currentRegion = null;

  async function loadSVG(svgPath) {
    try {
      const res = await fetch(svgPath);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const svgText = await res.text();
      mapContainer.innerHTML = svgText;
      return mapContainer.querySelector("svg");
    } catch (err) {
      mapContainer.innerHTML = `<div style="color:red;padding:10px;">Erreur lors du chargement du SVG : ${svgPath}<br>${err.message}</div>`;
      console.error("Erreur SVG :", err);
      return null;
    }
  }

  // === Chargement carte univers ===
  let svgDoc = await loadSVG("/data/maps/New_Eden.svg");
  if (!svgDoc) return;

  // === Interaction sur les régions ===
  function attachUniverseHandlers() {
    const regions = svgDoc.querySelectorAll("text");
    regions.forEach(text => {
      const name = text.textContent.trim();
      if (!name) return;

      text.style.cursor = "pointer";
      text.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const regionName = name.replace(/ /g, "_");
        console.log("🌌 Chargement de la région :", regionName);

        currentLevel = "region";
        currentRegion = regionName;
        regionTitle.textContent = `🥔 ${name}`;
        backButton.style.display = "block";

        const proxied = `/api/proxy_svg.php?url=${encodeURIComponent(`https://evemaps.dotlan.net/svg/${regionName}.svg`)}`;
        svgDoc = await loadSVG(proxied);
        if (svgDoc) attachRegionHandlers(name);
      });
    });
  }

  // === Interaction sur les systèmes ===
  function attachRegionHandlers(regionName) {
    const links = svgDoc.querySelectorAll("a");
    timersList.innerHTML = "";

    links.forEach(link => {
      link.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();

        const sysName = link.textContent.trim();
        timersList.innerHTML = "";

        const timers = structures.filter(s => s["Nom du système"]?.toUpperCase() === sysName.toUpperCase());
        if (timers.length === 0) {
          timersList.innerHTML = `<li>Aucun timer dans ${sysName}</li>`;
          return;
        }

        timers.forEach(s => {
          const date = new Date(s["Date"]);
          const now = new Date();
          const expired = date < now;
          const li = document.createElement("li");
          li.style.borderLeft = `4px solid ${expired ? "#ff4444" : "#ffaa00"}`;
          li.textContent = `${sysName} — ${s["Nom de la structure"]}`;
          timersList.appendChild(li);
        });
      });
    });
  }

  backButton.addEventListener("click", async () => {
    regionTitle.textContent = "🪐 New Eden";
    backButton.style.display = "none";
    timersList.innerHTML = "";
    currentLevel = "universe";
    svgDoc = await loadSVG("/data/maps/New_Eden.svg");
    if (svgDoc) attachUniverseHandlers();
  });

  attachUniverseHandlers();
}
