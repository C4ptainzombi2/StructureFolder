// === Gestion de l'affichage des structures ===
document.addEventListener("DOMContentLoaded", async () => {
  console.log("📡 PHStructures script loaded");

  const API_URL = "api/manage_structures.php";
  const tableBody = document.getElementById("tableBody");

  if (!tableBody) {
    console.error("❌ Élément #tableBody introuvable dans le DOM !");
    return;
  }

  // Fonction principale de chargement
  async function loadData() {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);

      const data = await response.json();
      console.log("✅ Données reçues :", data);

      if (!data || !data.structures || !Array.isArray(data.structures)) {
        tableBody.innerHTML = `<tr><td colspan="8">❌ Format de données invalide.</td></tr>`;
        return;
      }

      const structures = data.structures;
      if (structures.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="8">Aucune structure trouvée.</td></tr>`;
        return;
      }

      // Vide le tableau
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
          <td>${$["Temps restant"] || "-"}</td>
          <td>${s["Renforcée ?"] || s["Renforcé"] || "❌"}</td>
        `;
        tableBody.appendChild(tr);
      });

      // Affiche le nombre total (si tu veux)
      const counter = document.getElementById("counter");
      if (counter) counter.textContent = `Total : ${structures.length} structures`;

    } catch (err) {
      console.error("Erreur de chargement :", err);
      tableBody.innerHTML = `<tr><td colspan="8">❌ Erreur de chargement des données (${err.message})</td></tr>`;
    }
  }

  // Exécution au démarrage
  await loadData();

  // Bouton de rafraîchissement (si présent)
  const refreshBtn = document.getElementById("refreshBtn");
  if (refreshBtn) refreshBtn.addEventListener("click", loadData);
});
