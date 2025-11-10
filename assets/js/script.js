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
      return `${days}d ${hours.toString().padStart(2, "0")}h ${minutes
        .toString()
        .padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`;
    } else {
      return `${hours}h ${minutes.toString().padStart(2, "0")}m ${seconds
        .toString()
        .padStart(2, "0")}s`;
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

    // === Boutons DOTLAN ===
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
        if (totalHours < 1) {
          el.style.color = "#ff5555"; // Rouge vif si < 1h
        } else if (totalHours < 6) {
          el.style.color = "#ffaa00"; // Orange si < 6h
        } else if (totalHours < 24) {
          el.style.color = "#ffff66"; // Jaune si < 24h
        } else {
          el.style.color = "#00ff99"; // Vert sinon
        }
      }
    });
  }, 1000);

  // === Filtres ===
  function filterAndRender() {
    const search = (searchInput.value || "").toUpperCase();
    const region = regionFilter.value;
    const type = typeFilter.value;
    const alliance = allianceFilter.value;
    const constellation = constellationFilter.value;
    const reinforcedOnly = reinforcedFilter.checked;

    const filtered = allStructures.filter(s => {
      if (region && s["Région"] !== region) return false;
      if (type && s["Type"] !== type) return false;
      if (alliance && s["Alliance / Corporation"] !== alliance) return false;
      if (constellation && s["Constellation"] !== constellation) return false;
      if (reinforcedOnly && s["Renforcé"] !== "oui") return false;
      if (search && !Object.values(s).some(v => String(v).toUpperCase().includes(search))) return false;
      return true;
    });

    renderTable(filtered);
  }

  [regionFilter, typeFilter, allianceFilter, constellationFilter, reinforcedFilter, searchInput].forEach(el => {
    if (el) el.addEventListener("input", filterAndRender);
  });

  // 🔄 Ajout des événements pour les filtres dépendants
  [regionFilter, typeFilter, allianceFilter].forEach(el => {
    if (el) el.addEventListener("change", () => {
      updateDependentFilters();
      filterAndRender();
    });
  });

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      [regionFilter, typeFilter, allianceFilter, constellationFilter].forEach(el => el.value = "");
      reinforcedFilter.checked = false;
      searchInput.value = "";
      populateFilters();
      filterAndRender();
    });
  }

  // === Analyse du texte collé ===
  function parsePastedText(text) {
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    const firstLine = lines[0] || "";
    const match = firstLine.match(/^([A-Z0-9-]+)\s*-\s*(.+)$/i);
    const system = match ? match[1].trim() : "";
    const structureName = match ? match[2].trim() : "";

    const reinforcedMatch = text.match(/Reinforced until\s+(\d{4}\.\d{2}\.\d{2}\s+\d{2}:\d{2}:\d{2})/i);
    const date = reinforcedMatch ? reinforcedMatch[1].replace(/\./g, "-") : "";

    return { system, structureName, date };
  }

  // === Ajout / Mise à jour ===
  if (addButton) {
    addButton.addEventListener("click", async () => {
      const text = pasteArea.value.trim();
      if (!text) {
        feedback.textContent = "⚠️ Veuillez coller un texte avant d’ajouter.";
        return;
      }

      const { system, structureName, date } = parsePastedText(text);

      if (!system || !structureName || !date) {
        feedback.textContent = "⚠️ Format invalide ou timer manquant.";
        return;
      }

      feedback.textContent = "⏳ Vérification de la structure...";

      try {
        const res = await fetch(`${JSON_URL}?v=${Date.now()}`);
        const json = await res.json();
        const structures = json.structures || [];

        const existing = structures.find(s =>
          s["Nom du système"]?.toLowerCase() === system.toLowerCase() &&
          s["Nom de la structure"]?.toLowerCase() === structureName.toLowerCase()
        );

        if (!existing) {
          feedback.textContent = "❌ Structure non trouvée sur le serveur.";
          return;
        }

        const updated = {
          ...existing,
          "Renforcé": "oui",
          "Date": date
        };

        feedback.textContent = "⏳ Mise à jour sur le serveur...";

        const postRes = await fetch(JSON_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated)
        });

        const result = await postRes.json();

        if (result.success) {
          feedback.textContent = "✅ Structure mise à jour avec succès.";
          pasteArea.value = "";
          await loadData();
        } else {
          feedback.textContent = "❌ Erreur : " + (result.error || "mise à jour impossible.");
        }
      } catch (err) {
        console.error(err);
        feedback.textContent = "❌ Erreur réseau ou serveur.";
      }
    });
  }

  // === Ouvrir la modale DOTLAN ===
  function openDotlanModal(systemName) {
    const modal = document.getElementById("dotlanModal");
    const iframe = document.getElementById("dotlanFrame");

    if (!modal || !iframe) {
      console.error("⚠️ Modale DOTLAN introuvable.");
      return;
    }

    const cleanSystem = systemName.trim();
    const dotlanUrl = `https://evemaps.dotlan.net/svg/Universe.svg?&path=C-J6MT:${encodeURIComponent(cleanSystem)}`;

    iframe.src = dotlanUrl;
    modal.style.display = "flex";

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.style.display = "none";
        iframe.src = "";
      }
    });
  }

  // === Initialisation ===
  await loadData();
});
