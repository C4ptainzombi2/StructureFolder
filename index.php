<?php
require_once __DIR__ . '/config.php';
include __DIR__ . '/includes/header.php';
?>
<div id="pasteAreaContainer">
  <textarea id="pasteArea" placeholder="Collez ici les infos (ex : ZJ-5IS - Stupid Moon Drilling Station...)"></textarea>
  <button id="addButton">➕ Ajouter</button>
  <div id="pasteFeedback"></div>
</div>
<table id="structuresTable">
  <thead>
    <tr>
      <th>Nom du système</th><th>Nom de la structure</th><th>Région</th><th>Constellation</th><th>Type</th><th>Alliance</th><th>Date</th><th>⏱ Temps restant</th><th>Renforcé</th>
    </tr>
  </thead>
  <tbody id="tableBody"><tr><td colspan="9">Chargement des données...</td></tr></tbody>
</table>
<?php include __DIR__ . '/includes/footer.php'; ?>
