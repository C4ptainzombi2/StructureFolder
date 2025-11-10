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

  // Zone de collage
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

  // === Rendu du tableau ===
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
        <td>
          ${system}
          <button class="map-btn" data-system="${system}" title="Voir sur Dotlan">🗺️</button>
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

    counter.textContent = `Total : ${structures.length}`;
  }

  // === Mise à jour du compte à rebours ===
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

  // === Parser des timers collés ===
  function parseMultipleTimers(text) {
    text = text.replace(/\u202F/g, " ").replace(/\u00A0/g, " ").trim();
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const blocks = [];
    let cur = [];
    for (const l of lines) {
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
      const dateMatch = b.match(/Reinforced until\s*([0-9]{4}[.\-][0-9]{2}[.\-][0-9]{2}\s+[0-9]{2}[:][0-9]{2}[:][0-9]{2})/i);
      let date = "";
      if (dateMatch) date = dateMatch[1].replace(/\./g, "-");
      if (system && structureName && date) timers.push({ system, structureName, date });
    }
    console.log("🧩 Timers détectés :", timers);
    return timers;
  }
// === 🔽 TRI DU TABLEAU (A-Z sauf Timers) ===
document.querySelectorAll("#structuresTable th[data-sort]").forEach(th => {
  th.addEventListener("click", () => {
    const key = th.dataset.sort;
    let isAsc = th.dataset.order !== "asc"; // alterne seulement si pas Timers

    // Timers = toujours du plus court au plus long
    if (key === "timer") {
      isAsc = true; 
    } else {
      th.dataset.order = isAsc ? "asc" : "desc";
    }

    let sorted = [...allStructures];

    sorted.sort((a, b) => {
      let valA = "", valB = "";

      switch (key) {
        case "system":
          valA = a["Nom du système"] || "";
          valB = b["Nom du système"] || "";
          break;
        case "structure":
          valA = a["Nom de la structure"] || "";
          valB = b["Nom de la structure"] || "";
          break;
        case "region":
          valA = a["Région"] || "";
          valB = b["Région"] || "";
          break;
        case "constellation":
          valA = a["Constellation"] || "";
          valB = b["Constellation"] || "";
          break;
        case "type":
          valA = a["Type"] || "";
          valB = b["Type"] || "";
          break;
        case "alliance":
          valA = a["Alliance / Corporation"] || "";
          valB = b["Alliance / Corporation"] || "";
          break;
        case "date":
          valA = new Date(a["Date"] || 0);
          valB = new Date(b["Date"] || 0);
          break;
        case "timer":
          // ⏳ Tri du plus court au plus long uniquement
          const diffA = a["Date"] ? new Date(a["Date"]) - new Date() : Infinity;
          const diffB = b["Date"] ? new Date(b["Date"]) - new Date() : Infinity;
          return diffA - diffB;
      }

      // Comparaison générique
      if (valA < valB) return isAsc ? -1 : 1;
      if (valA > valB) return isAsc ? 1 : -1;
      return 0;
    });

    renderTable(sorted);
  });
});

  // === Ajouter / Mettre à jour les timers ===
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
      pasteFeedback.textContent = `⏳ Mise à jour de ${timers.length} timers...`;

      try {
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
          if (postRes.ok) {
            const result = await postRes.json();
            if (result.success) updatedCount++;
          }
        }

        pasteFeedback.textContent = `✅ ${updatedCount}/${timers.length} timers mis à jour.`;
        pasteArea.value = "";
        await loadData();
      } catch (err) {
        console.error(err);
        pasteFeedback.textContent = "❌ Erreur lors de la mise à jour.";
      }
    });
  }

  // === Modale Dotlan (ouvre SVG Dotlan Universe) ===
  function openDotlanModal(systemName) {
    const modal = document.getElementById("dotlanModal");
    const iframe = document.getElementById("dotlanFrame");
    const title = document.getElementById("dotlanTitle");
    const closeBtn = document.getElementById("dotlanClose");

    if (!modal || !iframe) return;
    title.textContent = `🗺️ Carte : ${systemName}`;
    iframe.src = `https://evemaps.dotlan.net/svg/Universe.svg?&path=C-J6MT:${encodeURIComponent(systemName)}`;
    modal.classList.add("active");

    closeBtn.addEventListener("click", () => {
      iframe.src = "";
      modal.classList.remove("active");
    });
    modal.addEventListener("click", e => {
      if (e.target === modal) {
        iframe.src = "";
        modal.classList.remove("active");
      }
    });
  }

  await loadData();
});
