document.addEventListener("DOMContentLoaded", async () => {
  console.log("📡 Chargement du module Structures — Drone Lands");

  const JSON_URL = "/api/manage_structures.php";

  // === Sélecteurs DOM ===
  const regionFilter = document.getElementById("regionFilter");
  const typeFilter = document.getElementById("typeFilter");
  const allianceFilter = document.getElementById("allianceFilter");
  const constellationFilter = document.getElementById("constellationFilter");
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
  console.log("🗺️ Initialisation de la carte stratégique (version avec légende personnalisée)...");

  const mapContainer = document.getElementById("strategicMap");
  const timersList = document.getElementById("mapTimersList");
  const regionTitle = document.getElementById("mapRegionTitle");
  const backButton = document.getElementById("mapBackButton");

  if (!mapContainer) return;

  // 🔧 Supprime les liens Dotlan
  function sanitizeSVG(svg) {
    svg.querySelectorAll("a").forEach(a => {
      a.removeAttribute("href");
      a.removeAttribute("xlink:href");
      a.addEventListener("click", e => e.preventDefault());
    });
  }

  // 🔧 Charge un SVG depuis un fichier ou Dotlan (via proxy)
  async function loadSVG(svgPath) {
    try {
      if (svgPath.startsWith("https://evemaps.dotlan.net/")) {
        svgPath = `/api/proxy_svg.php?url=${encodeURIComponent(svgPath)}`;
      }
      const res = await fetch(svgPath);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const svgText = await res.text();
      mapContainer.innerHTML = svgText;

      const svg = mapContainer.querySelector("svg");
      sanitizeSVG(svg);
      return svg;
    } catch (err) {
      mapContainer.innerHTML = `<div style="color:red;padding:10px;">Erreur lors du chargement du SVG : ${svgPath}<br>${err.message}</div>`;
      console.error("Erreur SVG :", err);
      return null;
    }
  }

  // === Fonction pour ajouter la légende personnalisée ===
  function addCustomLegend(svg) {
  // Supprimer uniquement la légende Dotlan sans toucher à la carte
  const texts = [...svg.querySelectorAll("text")];
  texts.forEach(t => {
    const txt = t.textContent.trim();
    if (
      txt.includes("Outer Passage") ||
      txt.includes("by Wollari") ||
      txt.includes("Refinery") ||
      txt.includes("Factory") ||
      txt.includes("Research") ||
      txt.includes("Contested")
    ) {
      // Supprime uniquement l'élément texte ou son groupe parent s’il s’agit d’un bloc de légende
      const parent = t.closest("g");
      if (parent && parent.querySelectorAll("text").length < 10) parent.remove();
      else t.remove();
    }
  });

  // Créer un groupe SVG pour la nouvelle légende
  const legendGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  legendGroup.setAttribute("id", "custom-legend");

  // Fond de la légende
  const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  bg.setAttribute("x", "20");
  bg.setAttribute("y", "640");
  bg.setAttribute("width", "220");
  bg.setAttribute("height", "42");
  bg.setAttribute("fill", "#111");
  bg.setAttribute("stroke", "#333");
  bg.setAttribute("rx", "6");
  bg.setAttribute("ry", "6");
  legendGroup.appendChild(bg);

  // Texte 1
  const txt1 = document.createElementNS("http://www.w3.org/2000/svg", "text");
  txt1.setAttribute("x", "35");
  txt1.setAttribute("y", "657");
  txt1.setAttribute("fill", "#ccc");
  txt1.setAttribute("font-size", "11");
  txt1.textContent = "⚙️ Gris = structures présentes";
  legendGroup.appendChild(txt1);

  // Texte 2
  const txt2 = document.createElementNS("http://www.w3.org/2000/svg", "text");
  txt2.setAttribute("x", "35");
  txt2.setAttribute("y", "672");
  txt2.setAttribute("fill", "#ff4444");
  txt2.setAttribute("font-size", "11");
  txt2.textContent = "🔥 Rouge = structures renforcées";
  legendGroup.appendChild(txt2);

  svg.appendChild(legendGroup);
}


  // === Met à jour les systèmes avec les compteurs ===
  function updateSystemIndicators(svg) {
    const texts = svg.querySelectorAll("a text, text");

    texts.forEach(text => {
      const systemName = text.textContent.trim();
      if (!systemName) return;

      // Trouve les structures associées à ce système
      const systemStructures = structures.filter(s =>
        s["Nom du système"]?.toUpperCase() === systemName.toUpperCase()
      );

      if (systemStructures.length > 0) {
        const reinforcedCount = systemStructures.filter(s => s["Renforcé"]?.toLowerCase() === "oui").length;

        // Ajout du compteur sous le nom
        const countText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        countText.setAttribute("x", text.getAttribute("x"));
        countText.setAttribute("y", parseFloat(text.getAttribute("y")) + 10);
        countText.setAttribute("font-size", "8");
        countText.setAttribute("text-anchor", "middle");
        countText.setAttribute("fill", "#aaa");
        countText.textContent = `(${systemStructures.length}/${reinforcedCount})`;
        text.parentNode.appendChild(countText);

        // Coloration du fond du système
        const shape = text.closest("a")?.querySelector("ellipse, rect, polygon") || text.closest("ellipse, rect, polygon");
        if (shape) {
          if (reinforcedCount > 0) {
            shape.setAttribute("fill", "#ffb3b3"); // rouge clair
          } else {
            shape.setAttribute("fill", "#d9d9d9"); // gris clair
          }
        }
      }
    });
  }

  // === Carte principale ===
  let svgDoc = await loadSVG("/data/maps/New_Eden.svg");
  if (!svgDoc) return;

  function attachUniverseHandlers() {
    const regions = svgDoc.querySelectorAll("text");
    regions.forEach(text => {
      const name = text.textContent.trim();
      if (!name) return;
      text.style.cursor = "pointer";
      text.addEventListener("click", async e => {
        e.preventDefault();
        e.stopPropagation();

        const regionName = name.replace(/ /g, "_");
        regionTitle.textContent = `🪐 ${name}`;
        backButton.style.display = "block";

        const dotlanURL = `https://evemaps.dotlan.net/svg/${regionName}.svg`;
        svgDoc = await loadSVG(dotlanURL);
        if (svgDoc) {
          updateSystemIndicators(svgDoc);
          addCustomLegend(svgDoc);
        }
      });
    });
  }

  backButton.addEventListener("click", async () => {
    regionTitle.textContent = "🪐 New Eden";
    backButton.style.display = "none";
    timersList.innerHTML = "";
    svgDoc = await loadSVG("/data/maps/New_Eden.svg");
    if (svgDoc) attachUniverseHandlers();
  });

  attachUniverseHandlers();
}
