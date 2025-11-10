<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

$dataFile = __DIR__ . '/../data/structures.json';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!file_exists($dataFile)) {
        echo json_encode(['success' => false, 'error' => 'Fichier non trouvé']);
        exit;
    }
    $json = file_get_contents($dataFile);
    echo $json;
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || empty($input['Nom du système']) || empty($input['Nom de la structure'])) {
        echo json_encode(['success' => false, 'error' => 'Entrée invalide']);
        exit;
    }

    if (!file_exists($dataFile)) {
        echo json_encode(['success' => false, 'error' => 'Fichier structures.json introuvable']);
        exit;
    }

    $data = json_decode(file_get_contents($dataFile), true);
    if (!$data || !isset($data['structures'])) {
        echo json_encode(['success' => false, 'error' => 'Format JSON invalide']);
        exit;
    }

    $updated = false;
    foreach ($data['structures'] as &$s) {
        if (
            strtolower(trim($s['Nom du système'])) === strtolower(trim($input['Nom du système'])) &&
            strtolower(trim($s['Nom de la structure'])) === strtolower(trim($input['Nom de la structure']))
        ) {
            $s['Renforcé'] = $input['Renforcé'] ?? $s['Renforcé'];
            $s['Date'] = $input['Date'] ?? $s['Date'];
            $updated = true;
            break;
        }
    }

    if (!$updated) {
        echo json_encode(['success' => false, 'error' => 'Structure non trouvée']);
        exit;
    }

    file_put_contents($dataFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    echo json_encode(['success' => true]);
    exit;
}

echo json_encode(['success' => false, 'error' => 'Méthode non autorisée']);
exit;
?>