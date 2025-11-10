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
    return days > 0
      ? `${days}d ${hours}h ${minutes}m ${seconds}s`
      : `${hours}h ${minutes}m ${seconds}s`;
  }

  // === Affichage du tableau ===
  function renderTable(structures) {
    if (!structures?.length) {
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
        const diff = new Date(date) - new Date();
        countdownHTML = diff > 0
          ? `<span class="countdown" data-target="${new Date(date).toISOString()}">${formatCountdown(diff)}</span>`
          : `<span class="expired">❌</span>`;
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
      btn.addEventListener("click", e => {
        e.preventDefault();
        openDotlanModal(e.currentTarget.dataset.system);
      });
    });

    counter.textContent = `Total : ${structures.length} structures`;
  }

  // === Mise à jour du compte à rebours ===
  setInterval(() => {
    document.querySelectorAll(".countdown").forEach(el => {
      const target = new Date(el.dataset.target);
      const diff = target - new Date();

      if (diff <= 0) {
        el.textContent = "❌";
        el.classList.replace("countdown", "expired");
        el.style.color = "#ff4444";
      } else {
        el.textContent = formatCountdown(diff);
      }
    });
  }, 1000);

  await loadData();
});


// === 🌌 Carte stratégique interactive ===
// === Carte stratégique interactive ===
async function initStrategicMap() {
  console.log("🗺️ Initialisation de la carte stratégique (version régions texte)...");

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
        mapContainer.innerHTML = `<div style="color:red;padding:10px;">Erreur lors du chargement du SVG : ${svgPath}</div>`;
        return null;
      }

      const svgText = await res.text();
      mapContainer.innerHTML = svgText;
      return mapContainer.querySelector("svg");
    } catch (err) {
      console.error("⚠️ Erreur inattendue lors du chargement du SVG :", err);
      mapContainer.innerHTML = `<div style="color:red;padding:10px;">Erreur de chargement : ${err.message}</div>`;
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
    console.log("🔍 Recherche des régions dans le SVG...");
    const textElements = svgDoc.querySelectorAll("text");

    textElements.forEach(textEl => {
      const regionName = textEl.textContent.trim();

      // Filtrer les textes non pertinents
      if (
        !regionName ||
        regionName.length < 3 ||
        /system|constellation|region|sysuse|legend/i.test(regionName)
      ) return;

      // Rendre cliquable le texte
      textEl.style.cursor = "pointer";
      textEl.style.fill = "#00d4ff";
      textEl.style.fontWeight = "bold";

      textEl.addEventListener("mouseenter", () => {
        textEl.style.fill = "#00ffaa";
      });

      textEl.addEventListener("mouseleave", () => {
        textEl.style.fill = "#00d4ff";
      });

      textEl.addEventListener("click", async (e) => {
        e.stopPropagation();
        const region = regionName.replace(/\s+/g, "_");
        console.log(`🪐 Chargement de la région ${region}...`);

        regionTitle.textContent = `🪐 ${regionName}`;
        backButton.style.display = "block";
        currentLevel = "region";
        currentRegion = regionName;

        const regionSvgPath = `https://evemaps.dotlan.net/svg/${encodeURIComponent(regionName)}.svg`;
        const regionSvg = await loadSVG(regionSvgPath);
        if (regionSvg) attachRegionHandlers(regionName);
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
