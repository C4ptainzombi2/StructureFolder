<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/functions.php';
include __DIR__ . '/includes/header.php';
?>

<div class="container">
  <header>
    <h1>📊 Structures — Drone Lands</h1>

    <div class="filters">
      <input type="text" id="searchInput" placeholder="🔍 Recherche (système, alliance...)" />
      <select id="regionFilter"></select>
      <select id="typeFilter"></select>
      <select id="allianceFilter"></select>
      <select id="constellationFilter"></select>
      <label>
        <input type="checkbox" id="reinforcedFilter"> ⚠️ Renforcé uniquement
      </label>
      <button id="resetFilters" title="Réinitialiser les filtres">♻️</button>
    </div>

    <p id="counter">Total : 0 structure</p>
  </header>

  <!-- Zone de collage / ajout timers -->
  <section id="pasteSection">
    <textarea id="pasteArea" placeholder="Collez ici les infos (ex : R3P0-Z - Station ... Reinforced until ...)"></textarea>
    <button id="addButton">➕ Ajouter / Mettre à jour</button>
    <div id="pasteFeedback" style="margin-top:5px;color:#ccc;"></div>
  </section>

  <!-- Tableau principal -->
  <table id="structuresTable">
    <thead>
      <tr>
        <th>Nom du système</th>
        <th>Nom de la structure</th>
        <th>Région</th>
        <th>Constellation</th>
        <th>Type</th>
        <th>Alliance / Corporation</th>
        <th>Date</th>
        <th id="countdownHeader" style="cursor:pointer;">Timers ⏳</th>
      </tr>
    </thead>
    <tbody id="tableBody">
      <tr><td colspan="8">Chargement des données...</td></tr>
    </tbody>
  </table>

  <!-- 🗺️ Carte stratégique interactive -->
  <section id="strategicSection">
    <h2>🗺️ Carte stratégique interactive</h2>

    <div id="mapContainer">
      <!-- SVG principal de New Eden -->
      <object id="strategicMap" type="image/svg+xml" data="/assets/maps/New_Eden.svg">
        Votre navigateur ne supporte pas les SVG interactifs.
      </object>

      <!-- Panneau d’informations à droite -->
      <aside id="mapSidebar">
        <h3 id="mapRegionTitle">Sélectionnez une région</h3>
        <ul id="mapTimersList">
          <li>Aucune région sélectionnée.</li>
        </ul>
        <button id="mapBackButton">⬅️ Retour à la carte globale</button>
      </aside>
    </div>
  </section>
</div>

<?php include __DIR__ . '/includes/modal_dotlan.php'; ?>
<?php include __DIR__ . '/includes/footer.php'; ?>
