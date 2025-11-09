<?php
/**
 * manage_structures.php
 * Gère la synchronisation des structures avec Google Sheets
 * et la sauvegarde dans /data/structures.json
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

$baseDir = realpath(__DIR__ . '/../data');
$jsonPath = "$baseDir/structures.json";
$regionsDir = "$baseDir/regions"; // si tu as les fichiers régions ici
$apiUrl = "https://script.google.com/macros/s/AKfycby5A8umWHXsxqHjSOQS6y6J3n-Kijdbj0g6uZyBkCmNl5niD5FcvM_Z7JiPwpQgZ9eT5A/exec";

// ==============================
// ===  SYNCHRONISATION (GET) ===
// ==============================
if ($_SERVER['REQUEST_METHOD'] === 'GET') {

    $remote = @file_get_contents($apiUrl);
    if (!$remote) {
        echo json_encode(["error" => "Impossible de contacter Google Sheets."]);
        exit;
    }

    $json = json_decode($remote, true);
    if (!$json || !isset($json['structures'])) {
        echo json_encode(["error" => "Données invalides reçues depuis l'API."]);
        exit;
    }

    $newStructures = $json['structures'];

    // Charger l'ancien fichier JSON local
    $oldData = file_exists($jsonPath)
        ? json_decode(file_get_contents($jsonPath), true)
        : ['structures' => []];

    // Charger les régions
    $regions = [];
    if (is_dir($regionsDir)) {
        foreach (glob("$regionsDir/*.json") as $file) {
            $regionData = json_decode(file_get_contents($file), true);
            if (!$regionData) continue;

            foreach ($regionData['constellations'] as $constellation => $systems) {
                foreach ($systems as $sys) {
                    $regions[strtoupper(trim($sys))] = [
                        'region' => $regionData['region'],
                        'constellation' => $constellation
                    ];
                }
            }
        }
    }

    // Fusion complète des structures
    foreach ($newStructures as &$s) {
        $sys = strtoupper(trim($s['Nom du système'] ?? ''));
        $nomStructure = trim($s['Nom de la structure'] ?? '');

        // Ajout région / constellation
        if (isset($regions[$sys])) {
            $s['Région'] = $regions[$sys]['region'];
            $s['Constellation'] = $regions[$sys]['constellation'];
        } else {
            $s['Région'] = $s['Région'] ?? "Inconnue";
            $s['Constellation'] = $s['Constellation'] ?? "Inconnue";
        }

        // Fusion avec ancienne version
        foreach ($oldData['structures'] as $old) {
            if (
                $old['Nom du système'] === $s['Nom du système'] &&
                $old['Nom de la structure'] === $nomStructure
            ) {
                foreach ($old as $key => $val) {
                    if (
                        !isset($s[$key]) ||
                        $s[$key] === "" ||
                        $s[$key] === "-" ||
                        $s[$key] === "." ||
                        $s[$key] === "Inconnu" ||
                        $s[$key] === "Inconnue"
                    ) {
                        $s[$key] = $val;
                    }
                }
            }
        }

        // Toujours avoir la clé Date
        if (!isset($s['Date'])) $s['Date'] = "";
    }

    // Sauvegarde fusionnée
    file_put_contents($jsonPath, json_encode(['structures' => $newStructures], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

    echo json_encode(['success' => true, 'structures' => $newStructures]);
    exit;
}

// ==============================
// ===  AJOUT / MISE À JOUR (POST)
// ==============================
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        echo json_encode(['success' => false, 'error' => 'Requête JSON invalide']);
        exit;
    }

    $data = file_exists($jsonPath)
        ? json_decode(file_get_contents($jsonPath), true)
        : ['structures' => []];

    $found = false;
    foreach ($data['structures'] as &$structure) {
        if (
            $structure['Nom du système'] === $input['Nom du système'] &&
            $structure['Nom de la structure'] === $input['Nom de la structure']
        ) {
            foreach ($input as $k => $v) {
                if ($v !== "" && $v !== "Inconnu" && $v !== "Inconnue") {
                    $structure[$k] = $v;
                }
            }
            $found = true;
            break;
        }
    }

    if (!$found) $data['structures'][] = $input;

    file_put_contents($jsonPath, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    echo json_encode(['success' => true, 'updated' => $found]);
    exit;
}

echo json_encode(["error" => "Méthode non supportée"]);
?>
