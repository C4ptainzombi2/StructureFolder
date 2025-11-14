<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

// Regions à surveiller
$regions = [
    10000043, 10000065, 10000070,
    10000064, 10000067, 10000088, 10000071
];

// Upwell structure IDs
$structureIDs = [
    35825, 35826, 35827, 35832,
    35833, 35834, 35835, 35836,
    47512, 47513, 47514
];

$minDate = isset($_GET["after"]) ? strtotime($_GET["after"]) : strtotime("-30 days");
$page = isset($_GET["page"]) ? intval($_GET["page"]) : 1;

$perPage = 50;
$allKills = [];

$limit = 500; // nombre de kills max récupérés pour éviter trop long

for ($i = 0; $i < $limit; $i++) {

    $json = @file_get_contents("https://redisq.zkillboard.com/listen.php?queueID=STRUCTURES");

    if (!$json) continue;

    $data = json_decode($json, true);

    if (!isset($data["package"]["killmail"])) continue;

    $km = $data["package"]["killmail"];
    $zkb = $data["package"]["zkb"];

    // Filtre régional
    if (!in_array($km["solar_system_id"], $regions)) continue;

    // Filtre date
    $time = strtotime($km["killmail_time"]);
    if ($time < $minDate) continue;

    // Filtre structure
    $shipID = $km["victim"]["ship_type_id"];
    if (!in_array($shipID, $structureIDs)) continue;

    // Ajoute kill
    $allKills[] = [
        "killmail" => $km,
        "zkb" => $zkb
    ];
}

// Pagination
$totalKills = count($allKills);
$totalPages = ceil($totalKills / $perPage);

$offset = ($page - 1) * $perPage;
$pageKills = array_slice($allKills, $offset, $perPage);

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
