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
        <th data-sort="system">Nom du système ⬍</th>
        <th data-sort="structure">Nom de la structure ⬍</th>
        <th data-sort="region">Région ⬍</th>
        <th data-sort="constellation">Constellation ⬍</th>
        <th data-sort="type">Type ⬍</th>
        <th data-sort="alliance">Alliance / Corporation ⬍</th>
        <th data-sort="date">Date ⬍</th>
        <th data-sort="timer" id="countdownHeader" style="cursor:pointer;">Timers ⏳</th>

      </tr>
    </thead>
    <tbody id="tableBody">
      <tr><td colspan="8">Chargement des données...</td></tr>
    </tbody>
  </table>

<!-- 🗺️ Carte stratégique interactive -->
<section id="strategicSection">
  <h2>🗺️ Carte stratégique</h2>

  <div id="mapContainer">
    <!-- ⚠️ L’élément dans lequel le SVG sera injecté -->
    <div id="strategicMap" title="Carte Drone Lands"></div>

    <!-- 📋 Panneau latéral -->
    <aside id="mapSidebar">
      <h3 id="mapRegionTitle">🪐 New Eden</h3>
      <ul id="mapTimersList"></ul>
      <button id="mapBackButton" style="display:none;">⬅️ Retour</button>
    </aside>
  </div>
</section>

<?php include __DIR__ . '/includes/modal_dotlan.php'; ?>
<?php include __DIR__ . '/includes/footer.php'; ?>
