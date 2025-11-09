<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>Structures - Drone Lands</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="<?= ASSETS_PATH ?>/css/style.css">
</head>
<body>
  <header>
    <h1>📊 Structures — Drone Lands</h1>
    <div id="filters">
      <input type="text" id="searchInput" placeholder="🔎 Recherche (système, alliance, remarque...)">
      <select id="regionFilter"><option value="">🌍 Toutes régions</option></select>
      <select id="typeFilter"><option value="">🏗️ Tous types</option></select>
      <select id="allianceFilter"><option value="">🛡️ Toutes alliances</option></select>
      <select id="constellationFilter"><option value="">🌌 Toutes constellations</option></select>
      <label><input type="checkbox" id="reinforcedFilter"> ⚠️ Renforcé uniquement</label>
      <button id="resetFilters" title="Réinitialiser les filtres">♻️</button>
    </div>
    <div id="counter">Chargement...</div>
  </header>
  <main>