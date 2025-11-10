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

  // Paste area + feedback + add button (réintégrés)
  const pasteArea = document.getElementById("pasteArea");
  const addButton = document.getElementById("addButton");
  const pasteFeedback = document.getElementById("pasteFeedback");

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
      const current = select.value;
      select.innerHTML = `<option value="">${label}</option>`;
      items.forEach(i => {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = i;
        select.appendChild(opt);
      });
      if (current) select.value = current;
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
    const reinforcedOnly = reinforcedFilter?.checked;

    if (region) filtered = filtered.filter(s => s["Région"] === region);
    if (type) filtered = filtered.filter(s => s["Type"] === type);
    if (alliance) filtered = filtered.filter(s => s["Alliance / Corporation"] === alliance);
    if (constellation) filtered = filtered.filter(s => s["Constellation"] === constellation);
    if (search)
      filtered = filtered.filter(s =>
        Object.values(s).some(v => v?.toString().toLowerCase().includes(search))
      );
    if (reinforcedOnly) filtered = filtered.filter(s => (s["Renforcé"] || "").toLowerCase() === "oui");

    renderTable(filtered);
  }

  [regionFilter, typeFilter, allianceFilter, constellationFilter].forEach(f =>
    f?.addEventListener("change", applyFilters)
  );
  searchInput?.addEventListener("input", applyFilters);
  reinforcedFilter?.addEventListener("change", applyFilters);

  resetBtn?.addEventListener("click", () => {
    [regionFilter, typeFilter, allianceFilter, constellationFilter, searchInput].forEach(el => {
      if (el) el.value = "";
    });
    if (reinforcedFilter) reinforcedFilter.checked = false;
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

  // === Rendu tableau ===
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

    // map-btn : ouvre le modal dotlan (modal existant dans ton includes)
    document.querySelectorAll(".map-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const systemName = e.currentTarget.dataset.system;
        openDotlanModal(systemName);
      });
    });

    counter.textContent = `Total : ${structures.length}`;
  }

  // intervalle compte à rebours
  setInterval(() => {
    document.querySelectorAll(".countdown").forEach(el => {
      const t = new Date(el.dataset.target);
      const diff = t - new Date();
      if (diff <= 0) {
        el.textContent = "❌";
        el.className = "expired";
      } else {
        el.textContent = formatCountdown(diff);
      }
    });
  }, 1000);

  // === Parser pour plusieurs timers collés ===
  function parseMultipleTimers(text) {
    // Normalize spaces & newlines
    text = text.replace(/\u202F/g, " ").replace(/\u00A0/g, " ").trim();
    // Heuristique : sépare sur les lignes qui commencent par un nom de système (lettres, chiffres, -)
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const blocks = [];
    let cur = [];
    for (const l of lines) {
      // ligne démarre par "XXXX-XX - Name" ou "SYSTEM - Name"
      if (/^[A-Z0-9-]{2,}\s*-\s*/i.test(l) && cur.length) {
        blocks.push(cur.join("\n"));
        cur = [l];
      } else {
        cur.push(l);
      }
    }
    if (cur.length) blocks.push(cur.join("\n"));

    const timers = [];
    for (const b of blocks) {
      const first = b.split("\n")[0];
      const m = first.match(/^([A-Z0-9-]+)\s*-\s*(.+)$/i);
      const system = m ? m[1].trim() : "";
      const structureName = m ? m[2].trim() : "";
      // cherche "Reinforced until 2025.11.13 01:48:26" ou "Reinforced until 2025-11-13 01:48:26"
      const dateMatch = b.match(/Reinforced until\s*([0-9]{4}[.\-][0-9]{2}[.\-][0-9]{2}\s+[0-9]{2}[:][0-9]{2}[:][0-9]{2})/i);
      let date = "";
      if (dateMatch) date = dateMatch[1].replace(/\./g, "-");
      if (system && structureName && date) timers.push({ system, structureName, date });
    }
    console.log("🧩 Timers détectés :", timers);
    return timers;
  }

  // === Handler du bouton Ajouter / Mise à jour ===
  if (addButton && pasteArea && pasteFeedback) {
    addButton.addEventListener("click", async () => {
      const text = pasteArea.value.trim();
      if (!text) {
        pasteFeedback.textContent = "⚠️ Veuillez coller un texte avant d’ajouter.";
        return;
      }
      const timers = parseMultipleTimers(text);
      if (timers.length === 0) {
        pasteFeedback.textContent = "⚠️ Aucun timer valide détecté.";
        return;
      }
      pasteFeedback.textContent = `⏳ Vérification et mise à jour de ${timers.length} timers...`;

      try {
        // refetch structures (fresh)
        const res = await fetch(`${JSON_URL}?v=${Date.now()}`);
        const json = await res.json();
        const structures = json.structures || [];
        let updatedCount = 0;

        for (const t of timers) {
          const existing = structures.find(s =>
            s["Nom du système"]?.toLowerCase() === t.system.toLowerCase() &&
            s["Nom de la structure"]?.toLowerCase() === t.structureName.toLowerCase()
          );
          if (!existing) continue;

          const updated = { ...existing, "Renforcé": "oui", "Date": t.date };

          const postRes = await fetch(JSON_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updated)
          });

          if (!postRes.ok) {
            console.warn("Erreur POST:", postRes.status);
            continue;
          }
          const result = await postRes.json();
          if (result.success) updatedCount++;
        }

        pasteFeedback.textContent = `✅ ${updatedCount}/${timers.length} timers mis à jour.`;
        pasteArea.value = "";
        await loadData();
      } catch (err) {
        console.error(err);
        pasteFeedback.textContent = "❌ Erreur réseau ou serveur.";
      }
    });
  }

  // === Modal Dotlan (utilisé par les map-btn du tableau) ===
  function closeDotlanModal() {
    const modal = document.getElementById("dotlanModal");
    const iframe = document.getElementById("dotlanFrame");
    if (!modal) return;
    modal.style.display = "none";
    if (iframe) iframe.src = "";
  }
  function openDotlanModal(systemName) {
    const modal = document.getElementById("dotlanModal");
    const iframe = document.getElementById("dotlanFrame");
    const closeBtn = document.querySelector("#dotlanModal button");

    if (!modal || !iframe) return;
    const cleanSystem = systemName.trim();
    const dotlanUrl = `https://evemaps.dotlan.net/svg/Universe.svg?&path=C-J6MT:${encodeURIComponent(cleanSystem)}`;
    iframe.src = dotlanUrl;
    modal.style.display = "flex";
    if (closeBtn) closeBtn.onclick = closeDotlanModal;
    modal.onclick = (e) => { if (e.target === modal) closeDotlanModal(); };
  }

  // === Initialisation ===
  await loadData();
  await initStrategicMap();
});

// ================= Carte stratégique =================
async function initStrategicMap() {
  console.log("🗺️ Initialisation de la carte stratégique…");

  // conteneur dans ton HTML (index.php)
  const mapContainer = document.getElementById("strategicMap");
  const timersList = document.getElementById("mapTimersList");
  const regionTitle = document.getElementById("mapRegionTitle");
  const backButton = document.getElementById("mapBackButton");
  if (!mapContainer) {
    console.warn("Conteneur stratégique introuvable (#strategicMap)");
    return;
  }

  // remplace les <a> par des <g> pour éviter la redirection
  function sanitizeSVG(svg) {
    if (!svg) return;
    svg.querySelectorAll("a").forEach(a => {
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      while (a.firstChild) g.appendChild(a.firstChild);
      a.replaceWith(g);
    });
  }

  // supprime les petits textes de souveraineté (S.R, M.O, etc.) et remplace la légende
  async function addCustomLegend(svg) {
    if (!svg) return;
    try {
      // supprime textes du type "S.R (3)" ou "M.O (5)" ou "STKN (5)" etc.
      svg.querySelectorAll("text").forEach(t => {
        const val = t.textContent.trim();
        // si valide: letters+maybe punctuation + space + (digits)
        if (/\([0-9]+\)\s*$/.test(val)) {
          // souvent format: "S.R (3)" ou "MO (5)" ou "STKN (5)"
          // on retire la parenthèse et tout ce qui l'entoure s'il n'y a pas de lettre système (ex: si text small)
          // plus sûr : on retire uniquement la parenthèse + nombre
          t.textContent = val.replace(/\s*\([0-9]+\)\s*$/, "").trim();
        }
      });

      // supprime le bloc de légende d'origine (recherche par mots-clés)
      svg.querySelectorAll("g").forEach(g => {
        const texts = Array.from(g.querySelectorAll("text")).map(t => t.textContent.toLowerCase());
        const keywords = ["refinery", "factory", "research", "outpost", "by wollari", "system", "outer passage", "xxxxx"];
        if (texts.some(t => keywords.some(k => t.includes(k)))) {
          g.remove();
        }
      });

      // calcule bbox/viewbox pour placer la légende
      let width = 1000, height = 800;
      try {
        if (svg.viewBox && svg.viewBox.baseVal && svg.viewBox.baseVal.width > 0) {
          width = svg.viewBox.baseVal.width;
          height = svg.viewBox.baseVal.height;
        } else {
          const bb = svg.getBBox();
          if (bb.width > 0 && bb.height > 0) {
            width = bb.width;
            height = bb.height;
          }
        }
      } catch (e) { /* ignore */ }

      const legendX = width - 260;
      const legendY = height - 70;

      // nouveau groupe legend
      const gLegend = document.createElementNS("http://www.w3.org/2000/svg", "g");
      gLegend.setAttribute("id", "custom-legend");

      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", legendX);
      rect.setAttribute("y", legendY);
      rect.setAttribute("width", "240");
      rect.setAttribute("height", "50");
      rect.setAttribute("fill", "#111");
      rect.setAttribute("stroke", "#333");
      rect.setAttribute("rx", "6");
      rect.setAttribute("ry", "6");
      rect.setAttribute("opacity", "0.95");
      gLegend.appendChild(rect);

      const t1 = document.createElementNS("http://www.w3.org/2000/svg", "text");
      t1.setAttribute("x", legendX + 12);
      t1.setAttribute("y", legendY + 18);
      t1.setAttribute("fill", "#ccc");
      t1.setAttribute("font-size", "11");
      t1.textContent = "⚙️ Gris = systèmes avec structures";
      gLegend.appendChild(t1);

      const t2 = document.createElementNS("http://www.w3.org/2000/svg", "text");
      t2.setAttribute("x", legendX + 12);
      t2.setAttribute("y", legendY + 35);
      t2.setAttribute("fill", "#ff5555");
      t2.setAttribute("font-size", "11");
      t2.textContent = "🔥 Rouge = structures renforcées";
      gLegend.appendChild(t2);

      svg.appendChild(gLegend);
    } catch (err) {
      console.error("Erreur addCustomLegend:", err);
    }
  }

  // charge un SVG (utilise ton proxy pour dotlan)
  async function loadSVG(svgPath) {
    try {
      if (svgPath.startsWith("https://evemaps.dotlan.net/")) {
        svgPath = `/api/proxy_svg.php?url=${encodeURIComponent(svgPath)}`;
      }
      const res = await fetch(svgPath);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const svgText = await res.text();

      // parse safely
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgText, "image/svg+xml");
      const newSvg = doc.querySelector("svg");
      if (!newSvg) throw new Error("Aucun <svg> trouvé");

      // remove previous svg(s) but not the whole container (prevents losing sidebar)
      mapContainer.querySelectorAll("svg").forEach(s => s.remove());
      // append
      mapContainer.appendChild(newSvg);

      // sanitize & legend
      sanitizeSVG(newSvg);
      await addCustomLegend(newSvg);

      console.log("✅ SVG chargé et inséré correctement :", svgPath);
      return newSvg;
    } catch (err) {
      mapContainer.innerHTML = `<div style="color:red;padding:10px;">Erreur lors du chargement du SVG : ${err.message}</div>`;
      console.error("Erreur SVG :", err);
      return null;
    }
  }

  // carte univers
  let svgDoc = await loadSVG("/data/maps/New_Eden.svg");
  if (!svgDoc) return;

  // attach handlers : clique sur texte -> ouvre carte région
  function attachUniverseHandlers() {
    svgDoc.querySelectorAll("text").forEach(text => {
      const name = text.textContent.trim();
      if (!name) return;
      text.style.cursor = "pointer";
      text.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const regionName = name.replace(/ /g, "_");
        regionTitle.textContent = `🪐 ${name}`;
        backButton.style.display = "block";
        const dotlanURL = `https://evemaps.dotlan.net/svg/${regionName}.svg`;
        svgDoc = await loadSVG(dotlanURL);
        if (svgDoc) attachRegionHandlers(name);
      });
    });
  }

  function attachRegionHandlers(regionName) {
    // systems were often in <a> tags that are now replaced by <g>
    const candidates = svgDoc.querySelectorAll("g");
    timersList.innerHTML = "";
    candidates.forEach(g => {
      // try to find a <text> inside (system name)
      const textNode = g.querySelector("text");
      if (!textNode) return;
      const sysName = textNode.textContent.trim();
      if (!sysName) return;
      // clickable: show timers from loaded structures (use global allStructures loaded earlier)
      g.style.cursor = "pointer";
      g.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        timersList.innerHTML = "";
        // structures come from window-level loaded JSON (we rely on endpoint reload)
        fetch('/api/manage_structures.php?v=' + Date.now()).then(r => r.json()).then(j => {
          const structs = j.structures || [];
          const timers = structs.filter(s => s["Nom du système"]?.toUpperCase() === sysName.toUpperCase());
          if (!timers.length) {
            timersList.innerHTML = `<li>Aucun timer dans ${sysName}</li>`;
            return;
          }
          timers.forEach(s => {
            const date = s["Date"] ? new Date(s["Date"]) : null;
            const now = new Date();
            const expired = date && date < now;
            const li = document.createElement("li");
            li.style.borderLeft = `4px solid ${expired ? "#ff4444" : "#ffaa00"}`;
            li.textContent = `${sysName} — ${s["Nom de la structure"]} ${s["Renforcé"] ? "(Renforcé)" : ""}`;
            timersList.appendChild(li);
          });
        }).catch(err => {
          console.error("Erreur fetch structures:", err);
          timersList.innerHTML = `<li>Erreur récupération timers</li>`;
        });
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
