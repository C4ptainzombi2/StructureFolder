<?php
date_default_timezone_set("UTC");

// Fichier cache
$cacheFile = __DIR__ . "/cache/30days_kills.json";
$days = 30;

// Régions surveillées
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

// En-tête
echo "==============================\n";
echo "   FETCH ZKILL STRUCTURES\n";
echo "==============================\n\n";


// -------------------------------
//  Fonction d'appel API ZKill
// -------------------------------
function getZKB($url) {
    global $totalRequests;

    $totalRequests++;
    echo "[REQ] $url\n";

    $opts = [
        "http" => [
            "method"  => "GET",
            "header"  => 
                "User-Agent: StructureCrawler/1.0 (contact: you@example.com)\r\n" .
                "Accept-Encoding: gzip\r\n"
        ]
    ];

    $context = stream_context_create($opts);
    $raw = @file_get_contents($url, false, $context);

    if (!$raw) {
        echo "❌ ERREUR : impossible de charger l'URL.\n";
        return null;
    }

    // Décompression gzip (certains serveurs l'imposent)
    if (substr($raw, 0, 2) === "\x1f\x8b") {
        $raw = gzdecode($raw);
    }

    $json = json_decode($raw, true);
    if ($json === null) {
        echo "❌ JSON INVALIDE\n";
        return null;
    }

    return $json;
}


// -------------------------------
//  Boucle sur régions & pages
// -------------------------------
foreach ($regions as $region) {
    echo "\n--- Région $region ---\n";

    for ($page = 1; $page <= 20; $page++) {

        $url = "https://zkillboard.com/api/kills/regionID/$region/page/$page/";
        $kills = getZKB($url);

        // Fin des pages
        if (!$kills || count($kills) === 0) {
            echo "[INFO] Fin des pages pour cette région.\n";
            break;
        }

        foreach ($kills as $k) {

            // Vérification timestamp
            if (!isset($k["killmail_time"])) {
                echo "⚠ Kill sans timestamp, ignoré.\n";
                continue;
            }

            $timestamp = strtotime($k["killmail_time"]);

            // Si kill + vieux que X jours → arrêter la région complète
            if ($timestamp < $limitDate) {
                echo "⛔ Kill trop vieux → arrêt région $region\n";
                break 2;
            }

            // Filtrage structure Upwell
            $ship = $k["victim"]["ship_type_id"] ?? 0;

            if (in_array($ship, $structureIDs)) {
                echo "✔ Structure trouvée : KillID ".$k["killmail_id"]."\n";
                $allKills[] = $k;
            }
        }

        // Pause anti-rate-limit (0.3 sec)
        usleep(300000);
    }
}


// -------------------------------
//   Sauvegarde finale
// -------------------------------
echo "\n=== SAUVEGARDE ===\n";
file_put_contents($cacheFile, json_encode($allKills, JSON_PRETTY_PRINT));

echo "✔ Total structures trouvées : ".count($allKills)."\n";
echo "✔ Requêtes envoyées : $totalRequests\n\n";
echo "=== FIN ===\n";
