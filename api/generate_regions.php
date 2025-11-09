<?php
header('Content-Type: application/json; charset=utf-8');

$rootDir = realpath(__DIR__ . '/..');
$dataDir = $rootDir . '/data';
$baseDir = $dataDir . '/regions';

// ✅ Création automatique des dossiers manquants
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0777, true);
}
if (!is_dir($baseDir)) {
    mkdir($baseDir, 0777, true);
}
if (!is_dir($baseDir)) mkdir($baseDir, 0777, true);

// ====================
// Charger les régions
// ====================
$regions = json_decode(file_get_contents('https://esi.evetech.net/latest/universe/regions/'), true);
if (!$regions) {
    echo json_encode(["error" => "Impossible de charger la liste des régions"]);
    exit;
}

foreach ($regions as $regionId) {
    $regionData = json_decode(file_get_contents("https://esi.evetech.net/latest/universe/regions/$regionId/"), true);
    if (!$regionData) continue;

    $regionName = $regionData['name'] ?? "Inconnue";
    $constellations = [];

    foreach ($regionData['constellations'] as $constId) {
        $constData = json_decode(file_get_contents("https://esi.evetech.net/latest/universe/constellations/$constId/"), true);
        if (!$constData) continue;

        $constName = $constData['name'] ?? "Inconnue";
        $systems = [];

        foreach ($constData['systems'] as $sysId) {
            $sysData = json_decode(file_get_contents("https://esi.evetech.net/latest/universe/systems/$sysId/"), true);
            if (!$sysData) continue;

            $systems[] = strtoupper(trim($sysData['name']));
        }

        $constellations[$constName] = $systems;
    }

    $regionFile = "$baseDir/" . preg_replace('/[^A-Za-z0-9_\-]/', '_', $regionName) . ".json";
    $jsonData = [
        'region' => $regionName,
        'constellations' => $constellations
    ];

    file_put_contents($regionFile, json_encode($jsonData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    echo "✅ Région générée : $regionName\n";
}

echo json_encode(["success" => true, "regions" => count($regions)]);
