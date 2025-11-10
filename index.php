<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/functions.php';
include __DIR__ . '/includes/header.php';
?>
<button id="debugToggle" title="Basculer le mode debug" style="
  position:absolute; top:10px; right:10px;
  background:${localStorage.getItem('debugMode')==='true' ? '#4caf50' : '#333'};
  color:white; border:none; border-radius:6px; padding:6px 10px;
  cursor:pointer;">🐞 Debug</button>
<script>
document.getElementById('debugToggle').addEventListener('click', () => {
  const newState = localStorage.getItem('debugMode') !== 'true';
  localStorage.setItem('debugMode', newState);
  location.reload();
});
</script>
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

<textarea id="pasteArea" placeholder="Collez ici les infos (ex : R3P0-Z - Station ... Reinforced until ...)"></textarea>
<button id="addButton">➕ Ajouter / Mettre à jour</button>
<div id="pasteFeedback" style="margin-top:5px;color:#ccc;"></div>


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
