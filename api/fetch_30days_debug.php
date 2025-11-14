<?php
date_default_timezone_set("UTC");

$cacheFile = __DIR__ . "/cache/30days_kills.json";
$days = 30;

// Regions à surveiller
$regions = [
    10000043, 10000065, 10000070,
    10000064, 10000067, 10000088, 10000071
];

// Structures Upwell
$structureIDs = [
    35825,35826,35827,35832,35833,
    35834,35835,35836,47512,47513,47514
];

$limitDate = strtotime("-$days days");
$allKills = [];
$totalRequests = 0;

echo "==============================\n";
echo "   FETCH ZKILL STRUCTURES\n";
echo "==============================\n\n";

function getZKB($url) {
    global $totalRequests;

    $totalRequests++;
    echo "[REQ] $url\n";

    $opts = [
        "http" => [
            "method" => "GET",
            "header" => "User-Agent: StructureCrawler/1.0\r\n"
        ]
    ];

    $raw = @file_get_contents($url, false, stream_context_create($opts));

    if (!$raw) {
        echo "❌ ERREUR : impossible de charger l'URL.\n";
        return null;
    }

    $json = json_decode($raw, true);
    if ($json === null) {
        echo "❌ JSON INVALIDE\n";
        return null;
    }

    return $json;
}

foreach ($regions as $region) {
    echo "\n--- Région $region ---\n";

    for ($page = 1; $page <= 20; $page++) {
        $url = "https://zkillboard.com/api/kills/regionID/$region/page/$page/";

        $kills = getZKB($url);
        if (!$kills || count($kills) === 0) {
            echo "[INFO] Fin des pages pour cette région.\n";
            break;
        }

        foreach ($kills as $k) {

            if (!isset($k["killmail_time"])) {
                echo "⚠ Kill sans timestamp, ignoré.\n";
                continue;
            }

            $t = strtotime($k["killmail_time"]);
            if ($t < $limitDate) {
                echo "⛔ Kill trop vieux → stop région $region\n";
                break 2;
            }

            $ship = $k["victim"]["ship_type_id"] ?? 0;
            if (in_array($ship, $structureIDs)) {
                echo "✔ Structure trouvée : KillID ".$k["killmail_id"]."\n";
                $allKills[] = $k;
            }
        }

        usleep(300000);
    }
}

echo "\n=== SAUVEGARDE ===\n";
file_put_contents($cacheFile, json_encode($allKills, JSON_PRETTY_PRINT));

echo "✔ Total structures trouvées : ".count($allKills)."\n";
echo "✔ Requêtes envoyées : $totalRequests\n";

echo "\n=== FIN ===\n";
