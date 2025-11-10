<?php
/**
 * Met à jour data/structures.json depuis Google Sheets
 * ➕ Fusionne les nouvelles données
 * ✅ Préserve tous les timers existants (Renforcé, Date)
 * 🚫 Ne supprime plus rien du tout.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$googleSheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRa7_5a2Ql2jUY7ToHlClU0X3hJB3ELIJnnLoPYhXdslYUhrwf5dxmTaowqM3DSV2K3cyyTNmnv1ljC/pub?gid=899915092&single=true&output=csv';

$dataDir = __DIR__ . '/../data/';
$dataFile = $dataDir . 'structures.json';
$regionsDir = $dataDir . 'regions/';

try {
    // --- 1️⃣ Charger le JSON existant ---
    $existingData = [];
    if (file_exists($dataFile)) {
        $json = file_get_contents($dataFile);
        $decoded = json_decode($json, true);
        $existingData = $decoded['structures'] ?? [];
    }

    // --- 2️⃣ Charger les données du Google Sheets ---
    $csv = file_get_contents($googleSheetUrl);
    if (!$csv) throw new Exception("Impossible de charger les données Google Sheets.");

    $lines = array_map('str_getcsv', explode("\n", trim($csv)));
    if (count($lines) < 2) throw new Exception("Le fichier CSV est vide ou mal formaté.");

    $headers = array_map('trim', array_shift($lines));

    // --- 3️⃣ Charger les régions et constellations ---
    $systemToRegion = [];
    $systemToConstellation = [];

    foreach (glob($regionsDir . '*.json') as $file) {
        $regionData = json_decode(file_get_contents($file), true);
        if (!$regionData || empty($regionData['region']) || empty($regionData['constellations'])) continue;

        $regionName = $regionData['region'];
        foreach ($regionData['constellations'] as $constellationName => $systems) {
            foreach ($systems as $system) {
                $system = strtoupper(trim($system));
                $systemToRegion[$system] = $regionName;
                $systemToConstellation[$system] = $constellationName;
            }
        }
    }

    // --- 4️⃣ Indexer les structures existantes ---
    $indexedExisting = [];
    foreach ($existingData as $s) {
        $key = strtolower(($s['Nom du système'] ?? '') . '|' . ($s['Nom de la structure'] ?? ''));
        $indexedExisting[$key] = $s;
    }

    // --- 5️⃣ Fusionner les données du Google Sheets ---
    foreach ($lines as $row) {
        if (empty(implode('', $row))) continue;
        $row = array_pad($row, count($headers), '');
        $item = array_combine($headers, array_map('trim', $row));

        $system = strtoupper($item['Nom du système'] ?? '');
        if (!$system) continue;

        $region = $systemToRegion[$system] ?? '';
        $constellation = $systemToConstellation[$system] ?? '';

        $new = [
            "Nom du système" => $system,
            "Nom de la structure" => $item['Remarques'] ?? '',
            "Type" => $item['Type'] ?? '',
            "Région" => $region,
            "Constellation" => $constellation,
            "Alliance / Corporation" => $item['Alliance / Corporation'] ?? '',
            "Renforcé" => $item['Renforcé'] ?? 'Non',
            "Date" => $item['Date'] ?? '',
        ];

        $key = strtolower($system . '|' . ($new['Nom de la structure'] ?? ''));

        // Si déjà existante, on fusionne
        if (isset($indexedExisting[$key])) {
            $old = $indexedExisting[$key];

            // Préserver les timers et la date
            if (!empty($old['Renforcé'])) $new['Renforcé'] = $old['Renforcé'];
            if (!empty($old['Date'])) $new['Date'] = $old['Date'];

            $indexedExisting[$key] = array_merge($old, $new);
        } else {
            // Nouvelle structure
            $indexedExisting[$key] = $new;
        }
    }

    // --- 6️⃣ Sauvegarder sans rien supprimer ---
    $finalData = array_values($indexedExisting);
    file_put_contents($dataFile, json_encode([
        'success' => true,
        'structures' => $finalData
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

    echo json_encode([
        'success' => true,
        'count' => count($finalData),
        'message' => '✅ Fusion réussie — Aucune donnée supprimée, timers conservés.'
    ]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
