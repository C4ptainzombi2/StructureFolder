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
  const addButton = document.getElementById("addButton");
  const pasteArea = document.getElementById("pasteArea");
  const feedback = document.getElementById("pasteFeedback");

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

  // === Génération des filtres ===
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

  // === Format du compte à rebours ===
  function formatCountdown(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return days > 0
      ? `${days}d ${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`
      : `${hours}h ${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`;
  }

  // === Rendu du tableau ===
  function renderTable(structures) {
    if (!structures || structures.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="9">Aucune structure trouvée</td></tr>`;
      counter.textContent = "Total : 0 structure";
      return;
    }

    tableBody.innerHTML = "";

    structures.forEach(s => {
      const system = s["Nom du système"] || "-";
      const structureName = s["Nom de la structure"] || s["Remarques"] || "-";
      const date = s["Date"] || "";
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
        <td>${system} <button class="map-btn" data-system="${system}" title="Ouvrir dans Dotlan">🗺️</button></td>
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

    counter.textContent = `Total : ${structures.length} structures`;
  }

  await loadData();
});


// === 🌌 Carte stratégique interactive ===
async function initStrategicMap() {
  console.log("🗺️ Initialisation de la carte stratégique...");

  const mapContainer = document.getElementById("strategicMapContainer");
  const timersList = document.getElementById("mapTimersList");
  const regionTitle = document.getElementById("mapRegionTitle");
  const backButton = document.getElementById("mapBackButton");

  if (!mapContainer) return;

  const res = await fetch("/data/structures.json");
  const json = await res.json();
  const structures = json.structures || [];

  async function loadSVG(svgPath) {
    try {
      const res = await fetch(svgPath);
      if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);

      const svgText = await res.text();
      mapContainer.innerHTML = svgText;
      return mapContainer.querySelector("svg");
    } catch (err) {
      console.error("Erreur lors du chargement du SVG :", err);
      mapContainer.innerHTML = `
        <div style="color:red;background:#0b0f18;border:1px solid #222;padding:10px;border-radius:8px;">
          Erreur lors du chargement du SVG : ${svgPath}
        </div>`;
      return null;
    }
  }

  // === Chargement de la carte principale ===
  let svgDoc = await loadSVG("/data/maps/New_Eden.svg");
  if (!svgDoc) return;

  function attachUniverseHandlers() {
    const regions = svgDoc.querySelectorAll("text");
    regions.forEach(region => {
      const regionName = region.textContent.trim();
      if (!regionName) return;

      region.style.cursor = "pointer";
      region.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();

        console.log(`🪐 Chargement de la région : ${regionName}`);
        regionTitle.textContent = `🪐 ${regionName}`;
        backButton.style.display = "block";

        // Utilisation du proxy PHP
        const regionSvgPath = `/api/proxy_svg.php?url=${encodeURIComponent(`https://evemaps.dotlan.net/svg/${regionName.replace(/ /g, "_")}.svg`)}`;
        const regionSvg = await loadSVG(regionSvgPath);

        if (regionSvg) {
          attachRegionHandlers(regionName);
        }
      });
    });
  }

  function attachRegionHandlers(regionName) {
    const svgSystems = mapContainer.querySelectorAll("a");
    timersList.innerHTML = "";

    svgSystems.forEach(link => {
      link.addEventListener("click", e => e.preventDefault()); // empêche toute redirection
    });
  }

  backButton.addEventListener("click", async () => {
    regionTitle.textContent = "🗺️ New Eden";
    backButton.style.display = "none";
    timersList.innerHTML = "";
    svgDoc = await loadSVG("/data/maps/New_Eden.svg");
    if (svgDoc) attachUniverseHandlers();
  });

  attachUniverseHandlers();
}

document.addEventListener("DOMContentLoaded", initStrategicMap);
