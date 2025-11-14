<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

$regions = [
    10000043, // Oasa
    10000065, // Perrigen Falls
    10000070, // The Spire
    10000064, // Etherium Reach
    10000067, // The Kalevala Expanse
    10000088, // Outer Passage
    10000071  // Malpais
];

$structureIDs = [
    35825, 35826, 35827, 35832, 35833, 35834, 35835, 35836,
    47512, 47513, 47514
];

$minDate = isset($_GET["after"]) ? strtotime($_GET["after"]) : strtotime("-30 days");
$page = isset($_GET["page"]) ? intval($_GET["page"]) : 1;

$perPage = 50;
$allKills = [];

$userAgent = "MyZkillFetcher/1.0";

foreach ($regions as $region) {
    for ($p = 1; $p <= 10; $p++) {

        $url = "https://zkillboard.com/api/kills/regionID/$region/page/$p/?orderDirection=desc";

        $opts = [
            "http" => [
                "method" => "GET",
                "header" => "User-Agent: $userAgent\r\n"
            ]
        ];

        $context = stream_context_create($opts);
        $json = @file_get_contents($url, false, $context);

        if (!$json) continue;

        $data = json_decode($json, true);
        if (!is_array($data) || count($data) === 0) break;

        foreach ($data as $entry) {

            $killID = $entry["killmail_id"];
            $hash = $entry["zkb"]["hash"];

            // Appel ESI pour obtenir les infos manquantes
            $esiURL = "https://esi.evetech.net/latest/killmails/$killID/$hash/";
            $esiJSON = @file_get_contents($esiURL);

            if (!$esiJSON) continue;
            $kill = json_decode($esiJSON, true);

            $killTime = strtotime($kill["killmail_time"]);

            if ($killTime < $minDate) continue;

            $shipID = $kill["victim"]["ship_type_id"] ?? 0;

            if (!in_array($shipID, $structureIDs)) continue;

            // Fusionne zKill + ESI
            $entry["esi"] = $kill;
            $allKills[] = $entry;

            // anti rate limit
            usleep(500000);
        }
    }
}

// Pagination
$totalKills = count($allKills);
$totalPages = ceil($totalKills / $perPage);

$offset = ($page - 1) * $perPage;
$pageKills = array_slice($allKills, $offset, $perPage);

// Calcul ISK
$totalISK = 0;
$pageISK = 0;

foreach ($allKills as $k) $totalISK += $k["zkb"]["totalValue"] ?? 0;
foreach ($pageKills as $k) $pageISK += $k["zkb"]["totalValue"] ?? 0;

echo json_encode([
    "page" => $page,
    "total_pages" => $totalPages,
    "total_isk" => $totalISK,
    "page_isk" => $pageISK,
    "kills" => $pageKills
], JSON_PRETTY_PRINT);
