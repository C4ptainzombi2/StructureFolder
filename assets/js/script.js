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
  console.log("🗺️ Initialisation de la carte stratégique…");

  const mapContainer = document.getElementById("strategicMap");
  const timersList = document.getElementById("mapTimersList");
  const regionTitle = document.getElementById("mapRegionTitle");
  const backButton = document.getElementById("mapBackButton");
  if (!mapContainer) return;

  // === Empêche les clics Dotlan de rediriger ===
  function sanitizeSVG(svg) {
    if (!svg) return;
    svg.querySelectorAll("a").forEach(a => {
      a.removeAttribute("href");
      a.removeAttribute("xlink:href");
      a.addEventListener("click", e => e.preventDefault());
    });
  }

  // === Légende personnalisée et nettoyage du SVG ===
async function addCustomLegend(svg) {
  if (!svg) {
    console.warn("❌ SVG non trouvé, impossible d'ajouter la légende.");
    return;
  }

  try {
    // Supprimer les textes du type "S.R (3)" ou "M.O (5)"
    const sovereigntyRegex = /^[A-Z]{1,3}\.[A-Z]{1,3}\s*\(\d+\)$/;
    svg.querySelectorAll("text").forEach(text => {
      const val = text.textContent.trim();
      if (sovereigntyRegex.test(val)) text.remove();
    });

    // Supprimer les légendes Dotlan existantes
    svg.querySelectorAll("g").forEach(g => {
      const texts = Array.from(g.querySelectorAll("text")).map(t => t.textContent.toLowerCase());
      const keywords = ["refinery", "factory", "research", "outpost", "wollari", "system", "industry", "offices", "cloning"];
      if (texts.some(t => keywords.some(k => t.includes(k)))) {
        g.remove();
      }
    });

    // Récupérer les dimensions du SVG pour placer ta légende
    let width = 1000, height = 800;
    if (svg.viewBox && svg.viewBox.baseVal && svg.viewBox.baseVal.width > 0) {
      width = svg.viewBox.baseVal.width;
      height = svg.viewBox.baseVal.height;
    } else {
      const bbox = svg.getBBox();
      if (bbox.width > 0 && bbox.height > 0) {
        width = bbox.width;
        height = bbox.height;
      }
    }

    // Groupe pour la légende personnalisée
    const legend = document.createElementNS("http://www.w3.org/2000/svg", "g");
    legend.setAttribute("id", "custom-legend");

    const x = width - 240;
    const y = height - 60;

    const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bg.setAttribute("x", x);
    bg.setAttribute("y", y);
    bg.setAttribute("width", "220");
    bg.setAttribute("height", "40");
    bg.setAttribute("fill", "#111");
    bg.setAttribute("stroke", "#333");
    bg.setAttribute("rx", "6");
    bg.setAttribute("ry", "6");
    bg.setAttribute("opacity", "0.9");
    legend.appendChild(bg);

    const line1 = document.createElementNS("http://www.w3.org/2000/svg", "text");
    line1.setAttribute("x", x + 10);
    line1.setAttribute("y", y + 17);
    line1.setAttribute("fill", "#ccc");
    line1.setAttribute("font-size", "11");
    line1.textContent = "⚙️ Gris = structures présentes";
    legend.appendChild(line1);

    const line2 = document.createElementNS("http://www.w3.org/2000/svg", "text");
    line2.setAttribute("x", x + 10);
    line2.setAttribute("y", y + 33);
    line2.setAttribute("fill", "#ff5555");
    line2.setAttribute("font-size", "11");
    line2.textContent = "🔥 Rouge = structures renforcées";
    legend.appendChild(line2);

    svg.appendChild(legend);

    console.log("✅ Nettoyage + légende personnalisée appliqués au SVG.");
  } catch (err) {
    console.error("⚠️ Erreur pendant le traitement du SVG :", err);
  }
}



  // === Chargement d’un SVG avec proxy ===
    async function loadSVG(svgPath) {
    try {
        // Proxy pour contourner CORS si nécessaire
        if (svgPath.startsWith("https://evemaps.dotlan.net/")) {
        svgPath = `/api/proxy_svg.php?url=${encodeURIComponent(svgPath)}`;
        }

        const res = await fetch(svgPath);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const svgText = await res.text();

        // 🔧 Crée un conteneur temporaire pour parser le SVG sans l’effacer du DOM
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgText, "image/svg+xml");
        const newSvg = doc.querySelector("svg");

        if (!newSvg) throw new Error("Aucun élément <svg> trouvé dans la ressource.");

        // 🧹 On vide uniquement l'ancien SVG, pas le container complet
        mapContainer.querySelectorAll("svg").forEach(s => s.remove());

        // 🔧 On conserve le SVG dans le DOM sans réécrire innerHTML
        mapContainer.appendChild(newSvg);

        // ✅ On neutralise les liens Dotlan
        sanitizeSVG(newSvg);

        console.log("✅ SVG chargé et inséré correctement :", svgPath);
        return newSvg;

    } catch (err) {
        mapContainer.innerHTML = `
        <div style="color:red;padding:10px;">
            Erreur lors du chargement du SVG : ${svgPath}<br>${err.message}
        </div>`;
        console.error("Erreur SVG :", err);
        return null;
    }
    }


  // === Chargement de la carte univers ===
  let svgDoc = await loadSVG("/data/maps/New_Eden.svg");
  if (!svgDoc) return;

  // === Clic sur région ===
  function attachUniverseHandlers() {
    svgDoc.querySelectorAll("text").forEach(text => {
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
        // ⚙️ Appliquer le nettoyage + ajout légende
        await addCustomLegend(svgDoc);

        // Réattacher les interactions sur les systèmes
        attachRegionHandlers(name);
}
      });
    });
  }

  // === Clic sur système ===
  function attachRegionHandlers(regionName) {
    const links = svgDoc.querySelectorAll("a");
    timersList.innerHTML = "";

    links.forEach(link => {
      link.removeAttribute("href");
      link.removeAttribute("xlink:href");

      link.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();

        const sysText = link.querySelector("text");
        const sysName = sysText ? sysText.textContent.trim() : "";
        if (!sysName) return;

        timersList.innerHTML = "";
        const timers = structures.filter(
          s => s["Nom du système"]?.toUpperCase() === sysName.toUpperCase()
        );

        if (!timers.length) {
          timersList.innerHTML = `<li>Aucune structure dans ${sysName}</li>`;
          return;
        }

        timers.forEach(s => {
          const date = new Date(s["Date"]);
          const expired = date < new Date();
          const li = document.createElement("li");
          li.style.borderLeft = `4px solid ${expired ? "#ff4444" : "#ffaa00"}`;
          li.textContent = `${sysName} — ${s["Nom de la structure"]}`;
          timersList.appendChild(li);
        });
      });
    });
  }

  // === Retour à la carte univers ===
  backButton.addEventListener("click", async () => {
    regionTitle.textContent = "🪐 New Eden";
    backButton.style.display = "none";
    timersList.innerHTML = "";
    svgDoc = await loadSVG("/data/maps/New_Eden.svg");
    if (svgDoc) attachUniverseHandlers();
  });

  attachUniverseHandlers();
}
