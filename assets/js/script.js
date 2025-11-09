document.addEventListener("DOMContentLoaded", async () => {
  console.log("📡 Chargement du module Structures — Drone Lands");

  // === CONFIG ===
const JSON_URL = "api/manage_structures.php";
  const API_URL = "api/manage_structures.php";

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
      console.log(`✅ Données chargées : ${allStructures.length}`);
      populateFilters();
      renderTable(allStructures);
    } catch (e) {
      console.error("Erreur de chargement :", e);
      tableBody.innerHTML = `<tr><td colspan="8">❌ Impossible de charger les données</td></tr>`;
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

  // === Affichage du tableau ===
  function renderTable(structures) {
    if (!structures || structures.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="8">Aucune structure trouvée</td></tr>`;
      counter.textContent = "Total : 0 structure";
      return;
    }

    tableBody.innerHTML = "";

    structures.forEach(s => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${s["Nom du système"] || "-"}</td>
        <td>${s["Nom de la structure"] || s["Remarques"] || "-"}</td>
        <td>${s["Région"] || "-"}</td>
        <td>${s["Constellation"] || "-"}</td>
        <td>${s["Type"] || "-"}</td>
        <td>${s["Alliance / Corporation"] || "-"}</td>
        <td>${s["Date"] || "-"}</td>
        <td>${s["Renforcée ?"] || s["Renforcé"] || "❌"}</td>
      `;
      tableBody.appendChild(tr);
    });

    counter.textContent = `Total : ${structures.length} structures`;
  }

  // === Filtres dynamiques ===
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
      if (reinforcedOnly && (s["Renforcée ?"] !== "oui" && s["Renforcé"] !== "oui")) return false;
      if (search && !Object.values(s).some(v => String(v).toUpperCase().includes(search))) return false;
      return true;
    });

    renderTable(filtered);
  }

  // === Événements ===
  [regionFilter, typeFilter, allianceFilter, constellationFilter, reinforcedFilter, searchInput].forEach(el => {
    if (el) el.addEventListener("input", filterAndRender);
  });

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      [regionFilter, typeFilter, allianceFilter, constellationFilter].forEach(el => el.value = "");
      if (reinforcedFilter) reinforcedFilter.checked = false;
      searchInput.value = "";
      filterAndRender();
    });
  }

  // === Initialisation ===
  await loadData();

  // --- AJOUT / MISE À JOUR D’UNE STRUCTURE ---
  const addButton = document.getElementById("addButton");
  const pasteArea = document.getElementById("pasteArea");
  const feedback = document.getElementById("pasteFeedback");

  if (addButton) {
    addButton.addEventListener("click", async () => {
      const text = pasteArea.value.trim();
      if (!text) {
        feedback.textContent = "⚠️ Veuillez coller un texte avant d’ajouter.";
        return;
      }

      // Extraction des infos depuis le texte collé
      const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
      const firstLine = lines[0] || "";
      const match = firstLine.match(/^([A-Z0-9-]+)\s*-\s*(.+)$/i);
      const system = match ? match[1].trim() : "";
      const structureName = match ? match[2].trim() : firstLine;

      // Extraction de la date
      let date = "";
      const dateMatch = text.match(/(\d{4}[.\-\/]\d{2}[.\-\/]\d{2})[^\d]*(\d{2}:\d{2}:\d{2})/);
      if (dateMatch) {
        date = dateMatch[1].replace(/[.\/]/g, "-") + " " + dateMatch[2];
      }

      // Détection du statut renforcé
      const isReinforced = /reinforced/i.test(text);

      // Charger les structures existantes
      const res = await fetch("data/structures.json");
      const data = await res.json();
      const structures = data.structures || [];

     // Recherche plus souple (ignore la casse et les espaces)
            const normalize = str => (str || "").toLowerCase().replace(/\s+/g, "").trim();

            const existing = structures.find(s =>
            normalize(s["Nom du système"]) === normalize(system) &&
            normalize(s["Nom de la structure"]) === normalize(structureName)
            );

      if (!existing) {
        feedback.textContent = "❌ Structure non trouvée dans les données existantes.";
        return;
      }

      // Préparation des données mises à jour
      const updated = {
        ...existing,
        "Nom du système": system,
        "Nom de la structure": structureName,
        "Date": date || existing["Date"] || "",
        "Renforcé": isReinforced ? "oui" : "non"
      };

      feedback.textContent = "⏳ Mise à jour en cours...";

      try {
        const postRes = await fetch("api/manage_structures.php", {
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
        console.error("Erreur lors de la mise à jour :", err);
        feedback.textContent = "❌ Erreur réseau ou serveur.";
      }
    });
  }
});
