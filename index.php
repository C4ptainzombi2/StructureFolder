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
      <label><input type="checkbox" id="reinforcedFilter"> ⚠️ Renforcé uniquement</label>
      <button id="resetFilters">♻️</button>
    </div>
    <p id="counter">Total : 0 structure</p>
  </header>

  <section id="pasteAreaContainer">
    <textarea id="pasteArea" placeholder="Collez ici les données copiées du jeu... (ex : ZJ-5IS - Astrahus - Alliance)"></textarea>
    <button id="addButton">Ajouter / Mettre à jour</button>
  </section>

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
        <th>Renforcé</th>
      </tr>
    </thead>
    <tbody id="tableBody">
      <tr><td colspan="8">Chargement des données...</td></tr>
    </tbody>
  </table>
</div>

<?php include __DIR__ . '/includes/modal_dotlan.php'; ?>
<?php include __DIR__ . '/includes/footer.php'; ?>
