<?php
/**
 * Génère le fichier data/structures.json à partir du Google Sheets (CSV)
 * et complète automatiquement la Région + Constellation
 * à partir des fichiers data/regions/*.json
 * ⚙️ Préserve les champs "Renforcé" et "Date" existants.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

// ⚠️ Lien Google Sheets public CSV :
$googleSheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRa7_5a2Ql2jUY7ToHlClU0X3hJB3ELIJnnLoPYhXdslYUhrwf5dxmTaowqM3DSV2K3cyyTNmnv1ljC/pub?gid=899915092&single=true&output=csv';

// Dossiers et fichiers
$dataDir = __DIR__ . '/../data/';
$dataFile = $dataDir . 'structures.json';
$regionsDir = $dataDir . 'regions/';

try {
    // --- 1️⃣ Charger les anciens timers existants ---
    $oldData = [];
    if (file_exists($dataFile)) {
        $json = file_get_contents($dataFile);
        $decoded = json_decode($json, true);
        $oldData = $decoded['structures'] ?? [];
    }

    // --- 2️⃣ Récupérer le CSV depuis Google Sheets ---
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

    // --- 4️⃣ Conversion CSV → structures + fusion avec les anciens timers ---
    foreach ($lines as $row) {
        if (empty(implode('', $row))) continue;
        $row = array_pad($row, count($headers), '');
        $item = array_combine($headers, array_map('trim', $row));

        $system = strtoupper($item['Nom du système'] ?? '');
        if (!$system) continue;

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

        // Nettoyage des valeurs
        foreach ($structure as $k => $v) {
            $structure[$k] = trim($v);
        }

        // 🔄 Fusion : préserver les timers existants
        foreach ($oldData as $old) {
            if (
                strtolower($old['Nom du système'] ?? '') === strtolower($structure['Nom du système']) &&
                strtolower($old['Nom de la structure'] ?? '') === strtolower($structure['Nom de la structure'])
            ) {
                if (!empty($old['Renforcé'])) {
                    $structure['Renforcé'] = $old['Renforcé'];
                }
                if (!empty($old['Date'])) {
                    $structure['Date'] = $old['Date'];
                }
                break;
            }
        }

        $structures[] = $structure;
    }

    // --- 5️⃣ Sauvegarde du fichier final ---
    $jsonData = [
        'success' => true,
        'structures' => $structures
    ];

    file_put_contents($dataFile, json_encode($jsonData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

    echo json_encode([
        'success' => true,
        'count' => count($structures),
        'message' => 'structures.json mis à jour avec succès (timers conservés ✅)',
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
