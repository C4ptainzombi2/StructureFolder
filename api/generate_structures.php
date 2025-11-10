<?php
/**
 * Génère le fichier data/structures.json à partir du Google Sheets (CSV)
 * et complète automatiquement la Région + Constellation
 * à partir des fichiers data/regions/*.json
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

// ⚠️ Mets ici ton lien CSV public Google Sheets :
$googleSheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-XXXXX/pub?output=csv';

// Dossier et fichiers
$dataDir = __DIR__ . '/../data/';
$dataFile = $dataDir . 'structures.json';
$regionsDir = $dataDir . 'regions/';

try {
    // --- 1️⃣ Récupération du CSV depuis Google Sheets ---
    $csv = file_get_contents($googleSheetUrl);
    if (!$csv) {
        throw new Exception("Impossible de récupérer les données depuis Google Sheets.");
    }

    $lines = array_map('str_getcsv', explode("\n", trim($csv)));
    if (count($lines) < 2) {
        throw new Exception("Le fichier CSV est vide ou mal formaté.");
    }

    $headers = array_map('trim', array_shift($lines));
    $structures = [];

    // --- 2️⃣ Charger les régions et constellations depuis /data/regions/*.json ---
    $systemToRegion = [];
    $systemToConstellation = [];

    foreach (glob($regionsDir . '*.json') as $file) {
        $regionData = json_decode(file_get_contents($file), true);
        if (!$regionData || empty($regionData['region']) || empty($regionData['constellations'])) {
            continue;
        }

        $regionName = $regionData['region'];
        foreach ($regionData['constellations'] as $constellationName => $systems) {
            foreach ($systems as $system) {
                $systemToRegion[strtoupper(trim($system))] = $regionName;
                $systemToConstellation[strtoupper(trim($system))] = $constellationName;
            }
        }
    }

    // --- 3️⃣ Convertir CSV → structures.json ---
    foreach ($lines as $row) {
        if (empty(implode('', $row))) continue;

        $row = array_pad($row, count($headers), '');
        $item = array_combine($headers, array_map('trim', $row));

        $system = strtoupper($item['Nom du système'] ?? '');
        if (!$system) continue;

        // Déterminer Région et Constellation automatiquement
        $region = $systemToRegion[$system] ?? '';
        $constellation = $systemToConstellation[$system] ?? '';

        $structure = [
            "Nom du système" => $system,
            "Nom de la structure" => $item['Remarques'] ?? '',
            "Type" => $item['Type'] ?? '',
            "Région" => $region,
            "Constellation" => $constellation,
            "Alliance / Corporation" => $item['Alliance / Corporation'] ?? '',
            "Renforcé" => $item['Renforcé'] ?? ($item['Renforcée ?'] ?? 'Non'),
            "Date" => $item['Date'] ?? '',
        ];

        foreach ($structure as $k => $v) {
            $structure[$k] = trim($v);
        }

        if (!empty($structure["Nom du système"])) {
            $structures[] = $structure;
        }
    }

    // --- 4️⃣ Sauvegarde finale ---
    $jsonData = [
        'success' => true,
        'structures' => $structures
    ];

    file_put_contents($dataFile, json_encode($jsonData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

    echo json_encode([
        'success' => true,
        'count' => count($structures),
        'message' => 'structures.json mis à jour avec succès avec régions et constellations auto-détectées'
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
