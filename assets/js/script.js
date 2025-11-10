document.addEventListener("DOMContentLoaded", async () => {
  console.log("📡 Chargement du module Structures — Drone Lands");

  const JSON_URL = "api/manage_structures.php";

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

  // === Mettre à jour les filtres dépendants ===
  function updateDependentFilters() {
    const selectedRegion = regionFilter.value;
    const selectedType = typeFilter.value;
    const selectedAlliance = allianceFilter.value;

    const filteredStructures = allStructures.filter(s => {
      if (selectedRegion && s["Région"] !== selectedRegion) return false;
      if (selectedType && s["Type"] !== selectedType) return false;
      if (selectedAlliance && s["Alliance / Corporation"] !== selectedAlliance) return false;
      return true;
    });

    const uniques = (key) => [...new Set(filteredStructures.map(s => s[key]).filter(Boolean))].sort();

    function fillSelect(select, items, label) {
      if (!select) return;
      const currentValue = select.value;
      select.innerHTML = `<option value="">${label}</option>`;
      items.forEach(i => {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = i;
        select.appendChild(opt);
      });
      if (currentValue && items.includes(currentValue)) select.value = currentValue;
    }

    fillSelect(constellationFilter, uniques("Constellation"), "🌌 Toutes constellations");
    fillSelect(typeFilter, uniques("Type"), "🏗️ Tous types");
    fillSelect(allianceFilter, uniques("Alliance / Corporation"), "🛡️ Toutes alliances");
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

  // === Mise à jour du compte à rebours en temps réel ===
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

  // === Analyse de plusieurs timers collés ===
  function parseMultipleTimers(text) {
    const timers = [];
    text = text.replace(/\u202F/g, " ").replace(/\u00A0/g, " ").trim();
    text = text.replace(/(?=[A-Z0-9-]{3,}\s*-\s*[A-Za-z0-9])/g, "\n");

    const blocks = text
      .split(/\n(?=[A-Z0-9-]{3,}\s*-\s*[A-Za-z0-9]+)/g)
      .map(b => b.trim())
      .filter(Boolean);

    for (const block of blocks) {
      const lines = block.split("\n").map(l => l.trim()).filter(Boolean);
      const firstLine = lines[0] || "";
      const match = firstLine.match(/^([A-Z0-9-]+)\s*-\s*(.+)$/i);
      const system = match ? match[1].trim() : "";
      const structureName = match ? match[2].trim() : "";
      const reinforcedMatch = block.match(/Reinforced until\s+(\d{4}\.\d{2}\.\d{2}\s+\d{2}:\d{2}:\d{2})/i);
      const date = reinforcedMatch ? reinforcedMatch[1].replace(/\./g, "-") : "";
      if (system && structureName && date) timers.push({ system, structureName, date });
    }

    console.log("🧩 Timers détectés :", timers);
    return timers;
  }

  // === Ajout / Mise à jour ===
  if (addButton) {
    addButton.addEventListener("click", async () => {
      const text = pasteArea.value.trim();
      if (!text) {
        feedback.textContent = "⚠️ Veuillez coller un texte avant d’ajouter.";
        return;
      }

      const timers = parseMultipleTimers(text);
      if (timers.length === 0) {
        feedback.textContent = "⚠️ Aucun timer valide détecté.";
        return;
      }

      feedback.textContent = "⏳ Vérification et mise à jour des structures...";

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

          const result = await postRes.json();
          if (result.success) updatedCount++;
        }

        feedback.textContent = `✅ ${updatedCount}/${timers.length} timers mis à jour avec succès.`;
        pasteArea.value = "";
        await loadData();
      } catch (err) {
        console.error(err);
        feedback.textContent = "❌ Erreur réseau ou serveur.";
      }
    });
  }

  // === Modale Dotlan ===
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

    modal.onclick = (e) => {
      if (e.target === modal) closeDotlanModal();
    };
  }

  // === Tri par Countdown ===
  let countdownSortAsc = true;
  const countdownHeader = document.getElementById("countdownHeader");
  if (countdownHeader) {
    countdownHeader.addEventListener("click", () => {
      const filtered = [...allStructures].filter(s => s["Date"]);
      filtered.sort((a, b) => {
        const dateA = new Date(a["Date"]);
        const dateB = new Date(b["Date"]);
        return countdownSortAsc ? dateA - dateB : dateB - dateA;
      });
      countdownSortAsc = !countdownSortAsc;
      countdownHeader.textContent = `Countdown ${countdownSortAsc ? "⏳↑" : "⏳↓"}`;
      renderTable(filtered);
    });
  }

  // === Initialisation ===
  await loadData();
});
