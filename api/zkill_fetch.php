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

$minDate = isset($_GET["after"]) ? strtotime($_GET["after"]) : strtotime("-30 days");
$page = isset($_GET["page"]) ? intval($_GET["page"]) : 1;
$perPage = 50;

$allKills = [];

foreach ($regions as $region) {
    $url = "https://zkillboard.com/api/kills/regionID/$region/";
    $json = @file_get_contents($url);
    if (!$json) continue;

    $data = json_decode($json, true);

    foreach ($data as $k) {
        $time = strtotime($k["killmail_time"]);
        if ($time >= $minDate && isset($k["victim"]["ship_type_id"])) {
            // Structures only:
            if ($k["victim"]["ship_type_id"] >= 35832) {
                $allKills[] = $k;
            }
        }
    }
}

$totalKills = count($allKills);
$totalPages = ceil($totalKills / $perPage);

$offset = ($page - 1) * $perPage;
$pageKills = array_slice($allKills, $offset, $perPage);

$totalISK = 0;
foreach ($allKills as $k) {
    $totalISK += $k["zkb"]["totalValue"] ?? 0;
}

$pageISK = 0;
foreach ($pageKills as $k) {
    $pageISK += $k["zkb"]["totalValue"] ?? 0;
}

echo json_encode([
    "page" => $page,
    "total_pages" => $totalPages,
    "total_isk" => $totalISK,
    "page_isk" => $pageISK,
    "kills" => $pageKills
]);
