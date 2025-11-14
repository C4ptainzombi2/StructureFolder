<?php
date_default_timezone_set("UTC");

// --- Config ---
$cacheFile = __DIR__ . "/cache/30days_kills.json";
$days = 30;

// Regions à surveiller
$regions = [
    10000043, 10000065, 10000070,
    10000064, 10000067, 10000088, 10000071
];

// Structures Upwell (ship_type_id)
$structureIDs = [
    35825,35826,35827,35832,35833,
    35834,35835,35836,47512,47513,47514
];

$limitDate = strtotime("-$days days");
$allKills = [];
$totalSystems = 0;
$totalRequests = 0;

echo "==============================\n";
echo "   STRUCTURE FETCH DEBUG\n";
echo "==============================\n\n";
echo "→ Fenêtre : $days jours\n";
echo "→ Cache : $cacheFile\n\n";

// ------------------------------
// Fonction GET avec debug
// ------------------------------
function getJSON($url) {
    global $totalRequests;

    $totalRequests++;
    echo "  [HTTP] GET $url\n";

    $opts = ["http" => [
        "method" => "GET",
        "header" => "User-Agent: StructureCrawler/1.0\r\n"
    ]];

    $raw = @file_get_contents($url, false, stream_context_create($opts));

    if (!$raw) {
        echo "  [ERREUR] Impossible de récupérer : $url\n";
        return null;
    }

    $json = json_decode($raw, true);

    if ($json === null) {
        echo "  [ERREUR JSON] Réponse invalide sur $url\n";
    }

    return $json;
}

// ------------------------------
// Étape 1 : récupérer les systèmes
// ------------------------------
echo "\n=== ÉTAPE 1 : Récupération des systèmes ===\n";

$systems = [];

foreach ($regions as $region) {
    echo "\n> Région $region\n";

    $regionData = getJSON("https://esi.evetech.net/latest/universe/regions/$region/");
    if (!$regionData) {
        echo "  [SKIP] Région non récupérée.\n";
        continue;
    }

    foreach ($regionData["constellations"] as $const) {
        echo "  > Constellation $const\n";

        $constData = getJSON("https://esi.evetech.net/latest/universe/constellations/$const/");
        if (!$constData) {
            echo "    [SKIP] Constellation non récupérée.\n";
            continue;
        }

        foreach ($constData["systems"] as $system) {
            echo "    + Ajout système $system\n";
            $systems[] = $system;
            $totalSystems++;
        }

        usleep(200000);
    }
}

echo "\n✔ Total systèmes trouvés : $totalSystems\n";

// ------------------------------
// Étape 2 : fetch kills par système
// ------------------------------
echo "\n=== ÉTAPE 2 : Récupération des kills ===\n";

$killsFound = 0;
$systemsProcessed = 0;

foreach ($systems as $systemID) {
    $systemsProcessed++;
    echo "\n--- Système $systemID ($systemsProcessed / $totalSystems) ---\n";

    $page = 1;

    while (true) {
        $url = "https://esi.evetech.net/latest/universe/system_kills/?system_id=$systemID&page=$page";
        echo "  Page $page → $url\n";

        $data = getJSON($url);

        if (!$data || empty($data)) {
            echo "  [INFO] Fin des pages pour ce système.\n";
            break;
        }

        foreach ($data as $kill) {

            if (!isset($kill["killmail_time"])) {
                echo "  [WARN] Kill sans timestamp, ignoré.\n";
                continue;
            }

            $time = strtotime($kill["killmail_time"]);
            if ($time < $limitDate) {
                echo "  [STOP] Kill trop vieux, on arrête ce système.\n";
                break 2;
            }

            $shipID = $kill["victim"]["ship_type_id"] ?? 0;

            if (in_array($shipID, $structureIDs)) {
                echo "  ✔ Structure détectée ! KillID = ".$kill["killmail_id"]."\n";
                $allKills[] = $kill;
                $killsFound++;
            }
        }

        $page++;
        usleep(300000);
    }
}

// ------------------------------
// Sauvegarde
// ------------------------------
echo "\n=== SAUVEGARDE ===\n";

file_put_contents($cacheFile, json_encode($allKills, JSON_PRETTY_PRINT));

echo "✔ Fichier écrit : $cacheFile\n";
echo "✔ Structures trouvées : $killsFound\n";
echo "✔ Requêtes HTTP envoyées : $totalRequests\n";

echo "\n=== FINI ===\n";
