<?php
// Le fichier où l’on stocke les kills
$cacheFile = __DIR__ . "/../cache/kills.json";

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

$allKills = [];

// On limite à 5 pages MAX par région
foreach ($regions as $region) {
    for ($p = 1; $p <= 5; $p++) {

        $url = "https://zkillboard.com/api/kills/regionID/$region/page/$p/?no-attackers";

        $json = @file_get_contents($url);
        if (!$json) continue;

        $data = json_decode($json, true);
        if (!is_array($data) || count($data) == 0) break;

        foreach ($data as $k) {

            $ship = $k["victim"]["ship_type_id"] ?? 0;
            if (!in_array($ship, $structureIDs)) continue;

            $allKills[] = $k;
        }

        sleep(1); // Evite le rate-limit zKill
    }
}

// Sauvegarde dans le cache
file_put_contents($cacheFile, json_encode($allKills, JSON_PRETTY_PRINT));

echo "OK : " . count($allKills) . " kills enregistrés.";
