<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/functions.php';
include __DIR__ . '/includes/header.php';
?>

<div class="container">
  <h1>💥 Structures détruites — Drone Lands (zKillboard)</h1>

  <p>
    Affichage des structures détruites dans :  
    <strong>Oasa, Perrigen Falls, The Spire, Etherium Reach, Kalevala, Outer Passage, Malpais</strong>
  </p>

  <div id="iskTotals" class="isk-box">
    Total ISK détruit (région chargée) : <span id="totalIsk"></span><br>
    Total ISK détruit (page) : <span id="pageIsk"></span>
  </div>

  <div id="killList"></div>

  <div id="pagination"></div>
</div>

<link rel="stylesheet" href="assets/css/zkill.css">
<script src="assets/js/zkill.js"></script>

<?php include __DIR__ . '/includes/footer.php'; ?>
