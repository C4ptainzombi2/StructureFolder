document.addEventListener("DOMContentLoaded", async () => {
  console.log("📡 Chargement du module Structures — Drone Lands");

  const API_URL = "api/manage_structures.php";
  const JSON_URL = "data/structures.json";

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

  // --- Charger les données ---
  async function loadData() {
    try {
      const res = await fetch(JSON_URL + "?v=" + Date.now());
      const json = await res.json();
      allStructures = json.structures || [];
      console.log("✅ Données chargées :", allStructures.length);
      populateFilters();
      renderTable(allStructures);
    } catch (e) {
      console.error("Erreur de chargement :", e);
      tableBody.innerHTML = `<tr><td colspan="8">❌ Impossible de charger les données</td></tr>`;
    }
  }

  // --- Peupler les filtres dynamiques ---
  function populateFilters() {
    const uniques = (key) => [...new Set(allStructures.map(s => s[key] || "Inconnu"))].sort();

    function fillSelect(select, items, defaultLabel) {
      if (!select) return;
      select.innerHTML = `<option value="">${defaultLabel}</option>`;
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

  // --- Rendu du tableau ---
  function renderTable(structures) {
    if (!structures || structures.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="8">Aucune structure trouvée</td></tr>`;
      if (counter) counter.textContent = "Total : 0 structure";
      return;
    }

    tableBody.innerHTML = "";

    // Ajout des lignes
    structures.forEach(s => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${s["Nom du système"] || "-"}</td>
        <td>${s["Remarques"] || "-"}</td>
        <td>${s["Région"] || "-"}</td>
        <td>${s["Constellation"] || "-"}</td>
        <td>${s["Type"] || "-"}</td>
        <td>${s["Alliance / Corporation"] || "-"}</td>
        <td>${s["Date"] || "-"}</td>
        <td>${s["Renforcée ?"] || s["Renforcé"] || "❌"}</td>
      `;
      tableBody.appendChild(tr);
    });

    if (counter) counter.textContent = `Total : ${structures.length} structures`;
  }

  // --- Filtrage dynamique ---
  function filterAndRender() {
    const search = (searchInput?.value || "").toUpperCase();
    const region = regionFilter?.value || "";
    const type = typeFilter?.value || "";
    const alliance = allianceFilter?.value || "";
    const constellation = constellationFilter?.value || "";
    const reinforcedOnly = reinforcedFilter?.checked;

    const filtered = allStructures.filter(s => {
      if (region && s["Région"] !== region) return false;
      if (type && s["Type"] !== type) return false;
      if (alliance && s["Alliance / Corporation"] !== alliance) return false;
      if (constellation && s["Constellation"] !== constellation) return false;
      if (reinforcedOnly && (s["Renforcée ?"] !== "oui" && s["Renforcé"] !== "oui")) return false;
      if (search && !Object.values(s).some(v => String(v).toUpperCase().includes(search))) return false;
      return true;
    });

    renderTable(filtered);
  }

  // --- Événements sur les filtres ---
  [regionFilter, typeFilter, allianceFilter, constellationFilter, reinforcedFilter, searchInput].forEach(el => {
    if (el) el.addEventListener("input", filterAndRender);
  });

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      [regionFilter, typeFilter, allianceFilter, constellationFilter].forEach(el => el.value = "");
      if (reinforcedFilter) reinforcedFilter.checked = false;
      if (searchInput) searchInput.value = "";
      filterAndRender();
    });
  }

  // --- Lancement initial ---
  await loadData();
});
