<?php
/**
 * Génère le fichier data/structures.json à partir d'un Google Sheets
 * CSV public.
 */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

// ⚠️ Remplace cette URL par ton lien CSV Google Sheets
$googleSheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRa7_5a2Ql2jUY7ToHlClU0X3hJB3ELIJnnLoPYhXdslYUhrwf5dxmTaowqM3DSV2K3cyyTNmnv1ljC/pub?gid=899915092&single=true&output=csv';

// Chemin du fichier JSON local à mettre à jour
$dataFile = __DIR__ . '/../data/structures.json';

try {
    // --- 1️⃣ Télécharger le CSV ---
    $csv = file_get_contents($googleSheetUrl);
    if (!$csv) {
        throw new Exception("Impossible de récupérer les données depuis Google Sheets.");
    }

    // --- 2️⃣ Conversion CSV → tableau associatif ---
    $lines = array_map('str_getcsv', explode("\n", trim($csv)));
    if (count($lines) < 2) {
        throw new Exception("Le fichier CSV semble vide ou mal formaté.");
    }

    $headers = array_map('trim', array_shift($lines)); // première ligne = noms de colonnes
    $structures = [];

    foreach ($lines as $row) {
        if (empty(implode('', $row))) continue; // ignore les lignes vides

        $row = array_pad($row, count($headers), '');
        $item = array_combine($headers, array_map('trim', $row));

        // --- 3️⃣ Mappage des colonnes Google Sheets vers ton format JSON ---
        $structure = [
            "Nom du système" => $item['Nom du système'] ?? '',
            "Nom de la structure" => $item['Remarques'] ?? '', // remarque = nom structure
            "Type" => $item['Type'] ?? '',
            "Région" => $item['Région'] ?? '',
            "Constellation" => $item['Constellation'] ?? '',
            "Alliance / Corporation" => $item['Alliance / Corporation'] ?? '',
            "Renforcé" => $item['Renforcé'] ?? ($item['Renforcée ?'] ?? 'non'),
            "Date" => $item['Date'] ?? '',
        ];

        // --- 4️⃣ Nettoyage minimal ---
        foreach ($structure as $k => $v) {
            $structure[$k] = trim($v);
        }

        // Ne pas enregistrer les lignes vides
        if (!empty($structure["Nom du système"]) && !empty($structure["Nom de la structure"])) {
            $structures[] = $structure;
        }
    }

    // --- 5️⃣ Écriture dans data/structures.json ---
    $jsonData = [
        'success' => true,
        'structures' => $structures
    ];

    file_put_contents($dataFile, json_encode($jsonData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

    echo json_encode([
        'success' => true,
        'count' => count($structures),
        'message' => 'structures.json mis à jour avec succès'
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
