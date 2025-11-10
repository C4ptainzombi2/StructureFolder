<?php
/**
 * manage_structures.php
 * Version fusionnée avec logs debug et compatibilité ancienne
 */

require_once __DIR__ . '/../config_debug.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

$baseDir = realpath(__DIR__ . '/../data');
$jsonPath = "$baseDir/structures.json";
$regionsDir = "$baseDir/regions";
$apiUrl = "https://script.google.com/macros/s/AKfycby5A8umWHXsxqHjSOQS6y6J3n-Kijdbj0g6uZyBkCmNl5niD5FcvM_Z7JiPwpQgZ9eT5A/exec";

/** === UTILITAIRES === **/
function normalize($str) {
    return strtolower(trim(preg_replace('/\s+/', '', $str ?? '')));
}
function load_json($path) {
    if (!file_exists($path)) return ['structures' => []];
    $data = json_decode(file_get_contents($path), true);
    return is_array($data) ? $data : ['structures' => []];
}
function save_json($path, $data) {
    file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

/** === MODE GET : Synchronisation avec Google Sheets === **/
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $remote = @file_get_contents($apiUrl);
    if (!$remote) exit(json_encode(['success' => false, 'error' => 'Impossible de contacter Google Sheets']));
    $json = json_decode($remote, true);
    if (!$json || !isset($json['structures'])) exit(json_encode(['success' => false, 'error' => 'Données invalides depuis Google Sheets']));

    $newStructures = $json['structures'];
    $oldData = load_json($jsonPath);

    // Chargement des régions
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

    // Fusion région + ancienne donnée
    foreach ($newStructures as &$s) {
        $sys = strtoupper(trim($s['Nom du système'] ?? ''));
        $nomStructure = trim($s['Nom de la structure'] ?? '');

        if (isset($regions[$sys])) {
            $s['Région'] = $regions[$sys]['region'];
            $s['Constellation'] = $regions[$sys]['constellation'];
        }

        foreach ($oldData['structures'] as $old) {
            if (
                normalize($old['Nom du système']) === normalize($sys) &&
                normalize($old['Nom de la structure']) === normalize($nomStructure)
            ) {
                foreach ($old as $key => $val) {
                    if (!isset($s[$key]) || $s[$key] === "" || $s[$key] === "-" || $s[$key] === "Inconnu") {
                        $s[$key] = $val;
                    }
                }
            }
        }

        if (!isset($s['Date'])) $s['Date'] = "";
        if (!isset($s['Renforcé']) && isset($s['Renforcée ?'])) $s['Renforcé'] = $s['Renforcée ?'];
    }

    save_json($jsonPath, ['structures' => $newStructures]);
    echo json_encode(['success' => true, 'structures' => $newStructures]);
    exit;
}

/** === MODE POST : Ajout / Mise à jour d’une structure === **/
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) exit(json_encode(['success' => false, 'error' => 'Requête JSON invalide']));

    $data = load_json($jsonPath);
    $structures = &$data['structures'];

    $sys = normalize($input['Nom du système'] ?? '');
    $name = normalize($input['Nom de la structure'] ?? '');

    if (!$sys || !$name) exit(json_encode(['success' => false, 'error' => 'Système ou structure manquant.']));

    $found = false;
    foreach ($structures as &$s) {
        if (
            normalize($s['Nom du système']) === $sys &&
            normalize($s['Nom de la structure']) === $name
        ) {
            if (!empty($input['Date'])) $s['Date'] = $input['Date'];
            if (isset($input['Renforcé']) || isset($input['Renforcée ?'])) {
                $s['Renforcé'] = ($input['Renforcé'] ?? $input['Renforcée ?']) ?: 'oui';
            }
            $found = true;
            break;
        }
    }

    debug_log("🔍 Recherche: system={$input['Nom du système']} | structure={$input['Nom de la structure']} | found=" . ($found ? 'oui' : 'non'));

    if (!$found) {
        debug_log("⚠️ Structure non trouvée — ajout automatique.");
        $structures[] = [
            "Nom du système" => $input["Nom du système"],
            "Nom de la structure" => $input["Nom de la structure"],
            "Date" => $input["Date"] ?? "",
            "Renforcé" => $input["Renforcé"] ?? "oui"
        ];
    } else {
        debug_log("✅ Structure mise à jour. Date={$input['Date']}, Reinforcé={$input['Renforcé']}");
    }

    save_json($jsonPath, $data);
    echo json_encode(["success" => true, "updated" => $found]);
    exit;
}

echo json_encode(["success" => false, "error" => "Méthode non supportée"]);
?>
