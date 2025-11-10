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

  // === Charger les données JSON ===
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


// === 🗺️ Gestion de la carte stratégique ===
async function initStrategicMap(structures) {
  console.log("🗺️ Initialisation de la carte stratégique…");

  const mapContainer = document.getElementById("strategicMap");
  const regionTitle = document.getElementById("mapRegionTitle");
  const backButton = document.getElementById("mapBackButton");
  if (!mapContainer) return;

  function sanitizeSVG(svg) {
    svg.querySelectorAll("a").forEach(a => {
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      while (a.firstChild) g.appendChild(a.firstChild);
      a.replaceWith(g);
    });
  }

  async function addCustomLegend(svg) {
    if (!svg) return;

    // Supprimer "S.R (3)" etc.
    const sovereigntyPattern = /\b([A-Z]\.[A-Z])\s*\(\d+\)/g;
    svg.querySelectorAll("text").forEach(t => {
      if (sovereigntyPattern.test(t.textContent)) {
        t.textContent = t.textContent.replace(sovereigntyPattern, "").trim();
      }
    });

    // Supprimer légende Dotlan
    svg.querySelectorAll("g").forEach(g => {
      const texts = [...g.querySelectorAll("text")].map(t => t.textContent);
      if (texts.some(txt =>
        txt.includes("Refinery") || txt.includes("Factory") || txt.includes("Research") ||
        txt.includes("by Wollari") || txt.includes("System") || txt.includes("Outer Passage")
      )) {
        g.remove();
      }
    });

    // Ajouter la légende personnalisée
    const vb = svg.viewBox.baseVal || { width: 1800, height: 1200 };
    const legendX = vb.width - 250;
    const legendY = vb.height - 70;

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bg.setAttribute("x", legendX);
    bg.setAttribute("y", legendY);
    bg.setAttribute("width", "230");
    bg.setAttribute("height", "50");
    bg.setAttribute("fill", "#111");
    bg.setAttribute("stroke", "#333");
    bg.setAttribute("rx", "6");
    bg.setAttribute("ry", "6");
    g.appendChild(bg);

    const t1 = document.createElementNS("http://www.w3.org/2000/svg", "text");
    t1.setAttribute("x", legendX + 15);
    t1.setAttribute("y", legendY + 20);
    t1.setAttribute("fill", "#ccc");
    t1.setAttribute("font-size", "11");
    t1.textContent = "⚙️ Gris = structures présentes";
    g.appendChild(t1);

    const t2 = document.createElementNS("http://www.w3.org/2000/svg", "text");
    t2.setAttribute("x", legendX + 15);
    t2.setAttribute("y", legendY + 38);
    t2.setAttribute("fill", "#ff5555");
    t2.setAttribute("font-size", "11");
    t2.textContent = "🔥 Rouge = structures renforcées";
    g.appendChild(t2);

    svg.appendChild(g);
    console.log("✅ Légende personnalisée ajoutée");
  }

  async function loadSVG(svgPath) {
    try {
      if (svgPath.startsWith("https://evemaps.dotlan.net/")) {
        svgPath = `/api/proxy_svg.php?url=${encodeURIComponent(svgPath)}`;
      }

      const res = await fetch(svgPath);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const svgText = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgText, "image/svg+xml");
      const svg = doc.querySelector("svg");

      mapContainer.innerHTML = "";
      mapContainer.appendChild(svg);

      sanitizeSVG(svg);
      await addCustomLegend(svg);
      return svg;

    } catch (err) {
      mapContainer.innerHTML = `<div style="color:red;padding:10px;">Erreur SVG : ${err.message}</div>`;
      return null;
    }
  }

  // === Carte principale ===
  let svgDoc = await loadSVG("/data/maps/New_Eden.svg");
  if (!svgDoc) return;

  function attachUniverseHandlers() {
    svgDoc.querySelectorAll("text").forEach(text => {
      const name = text.textContent.trim();
      if (!name) return;
      text.style.cursor = "pointer";
      text.addEventListener("click", async () => {
        const regionName = name.replace(/ /g, "_");
        regionTitle.textContent = `🪐 ${name}`;
        backButton.style.display = "block";
        const dotlanURL = `https://evemaps.dotlan.net/svg/${regionName}.svg`;
        svgDoc = await loadSVG(dotlanURL);
      });
    });
  }

  backButton.addEventListener("click", async () => {
    regionTitle.textContent = "🪐 New Eden";
    backButton.style.display = "none";
    svgDoc = await loadSVG("/data/maps/New_Eden.svg");
    if (svgDoc) attachUniverseHandlers();
  });

  attachUniverseHandlers();
}
