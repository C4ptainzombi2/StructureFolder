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

  // === Génération des filtres dynamiques ===
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

    if (days > 0) {
      return `${days}d ${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`;
    } else {
      return `${hours}h ${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`;
    }
  }

  // === Affichage du tableau ===
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
        if (diff > 0) {
          countdownHTML = `<span class="countdown" data-target="${target.toISOString()}">${formatCountdown(diff)}</span>`;
        } else {
          countdownHTML = `<span class="expired">❌</span>`;
        }
      }

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>
          ${system}
          <button class="map-btn" data-system="${system}" title="Ouvrir dans Dotlan">🗺️</button>
        </td>
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

    document.querySelectorAll(".map-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const systemName = e.currentTarget.dataset.system;
        openDotlanModal(systemName);
      });
    });

    counter.textContent = `Total : ${structures.length} structures`;
  }

  // === Mise à jour du compte à rebours ===
  setInterval(() => {
    document.querySelectorAll(".countdown").forEach(el => {
      const targetDate = new Date(el.dataset.target);
      const diff = targetDate - new Date();

      if (diff <= 0) {
        el.textContent = "❌";
        el.classList.add("expired");
        el.style.color = "#ff4444";
        el.classList.remove("countdown");
      } else {
        el.textContent = formatCountdown(diff);
        const totalHours = diff / 3600000;
        if (totalHours < 1) el.style.color = "#ff5555";
        else if (totalHours < 6) el.style.color = "#ffaa00";
        else if (totalHours < 24) el.style.color = "#ffff66";
        else el.style.color = "#00ff99";
      }
    });
  }, 1000);

  // === Initialisation ===
  await loadData();
});


// === Carte stratégique interactive ===
async function initStrategicMap() {
  console.log("🗺️ Initialisation de la carte stratégique...");

  const mapContainer = document.getElementById("strategicMapContainer");
  const timersList = document.getElementById("mapTimersList");
  const regionTitle = document.getElementById("mapRegionTitle");
  const backButton = document.getElementById("mapBackButton");

  if (!mapContainer) {
    console.warn("⚠️ Conteneur de carte introuvable !");
    return;
  }

  let currentLevel = "universe";
  let currentRegion = null;

  const res = await fetch("/data/structures.json");
  const json = await res.json();
  const structures = json.structures || [];

  async function loadSVG(svgPath) {
    try {
      if (!svgPath.startsWith("http")) {
        svgPath = svgPath.startsWith("/") ? svgPath : "/" + svgPath;
      }

      const res = await fetch(svgPath);
      if (!res.ok) {
        console.error(`❌ Impossible de charger le SVG : ${svgPath} (${res.status})`);
        return null;
      }

      const svgText = await res.text();
      mapContainer.innerHTML = svgText;
      return mapContainer.querySelector("svg");
    } catch (err) {
      console.error("⚠️ Erreur inattendue lors du chargement du SVG :", err);
      return null;
    }
  }

  // === Carte principale ===
  let svgDoc = await loadSVG("/data/maps/New_Eden.svg");
  if (!svgDoc) {
    mapContainer.innerHTML = "❌ Impossible de charger la carte SVG principale.";
    return;
  }

  function attachUniverseHandlers() {
    const regions = svgDoc.querySelectorAll("g[id]");
    regions.forEach(region => {
      region.style.cursor = "pointer";
      region.addEventListener("click", async () => {
        const regionName = region.id.replace(/_/g, " ");
        currentLevel = "region";
        currentRegion = regionName;
        regionTitle.textContent = `🪐 ${regionName}`;
        backButton.style.display = "block";

        const regionSvgPath = `https://evemaps.dotlan.net/svg/${encodeURIComponent(regionName)}.svg`;
        svgDoc = await loadSVG(regionSvgPath);
        if (svgDoc) attachRegionHandlers(regionName);
      });
    });
  }

  function attachRegionHandlers(regionName) {
    const svgSystems = svgDoc.querySelectorAll("a");
    timersList.innerHTML = "";

    svgSystems.forEach(link => {
      const systemName = link.textContent.trim();
      if (!systemName) return;

      const systemTimers = structures.filter(
        s => s["Nom du système"]?.toUpperCase() === systemName.toUpperCase()
      );

      if (systemTimers.length > 0) {
        const now = new Date();
        const hasActive = systemTimers.some(s => new Date(s["Date"]) > now);
        const hasExpired = systemTimers.some(s => new Date(s["Date"]) < now);
        const color = hasExpired ? "#ff5555" : hasActive ? "#ffaa00" : "#00ff99";
        link.querySelector("circle, rect")?.setAttribute("fill", color);
      }

      link.addEventListener("click", e => {
        e.preventDefault();
        timersList.innerHTML = "";

        if (systemTimers.length === 0) {
          timersList.innerHTML = `<li>Aucun timer dans ${systemName}</li>`;
          return;
        }

        systemTimers.forEach(s => {
          const date = s["Date"] ? new Date(s["Date"]) : null;
          const now = new Date();
          const color = date && date > now ? "#ffaa00" : "#ff4444";

          const li = document.createElement("li");
          li.style.borderLeft = `4px solid ${color}`;
          li.textContent = `${systemName} — ${s["Nom de la structure"]}`;
          timersList.appendChild(li);
        });
      });
    });
  }

  backButton.addEventListener("click", async () => {
    currentLevel = "universe";
    regionTitle.textContent = "🗺️ New Eden";
    backButton.style.display = "none";
    timersList.innerHTML = "";
    svgDoc = await loadSVG("/data/maps/New_Eden.svg");
    if (svgDoc) attachUniverseHandlers();
  });

  attachUniverseHandlers();
}

document.addEventListener("DOMContentLoaded", initStrategicMap);
