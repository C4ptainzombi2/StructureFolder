<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

// Regions to fetch
$regions = [
    10000043, // Oasa
    10000065, // Perrigen Falls
    10000070, // The Spire
    10000064, // Etherium Reach
    10000067, // Kalevala Expanse
    10000088, // Outer Passage
    10000071  // Malpais
];

$structureGroups = [
    365,   // Citadels
    1404,  // Engineering Complexes
    1406,  // Refineries
    2016,  // FLEX structures
    1657,  // Sov structures
    995,   // POS towers
    473,   // POS modules
];

$minDate = isset($_GET["after"]) ? strtotime($_GET["after"]) : strtotime("-30 days");
$page = isset($_GET["page"]) ? intval($_GET["page"]) : 1;
$perPage = 50;

$allKills = [];

foreach ($regions as $region) {

    $url = "https://zkillboard.com/api/kills/regionID/$region/";
    $opts = [
        "http" => [
            "method" => "GET",
            "header" => "User-Agent: mykillboard/1.0\r\n"
        ]
    ];
    $context = stream_context_create($opts);
    $json = @file_get_contents($url, false, $context);

    if (!$json) continue;

    $data = json_decode($json, true);
    if (!is_array($data)) continue;

    foreach ($data as $k) {

        // Protect against malformed rows
        if (!isset($k["killmail_time"])) continue;
        if (!isset($k["victim"]["group_id"])) continue;

        $groupID = $k["victim"]["group_id"];
        if (!in_array($groupID, $structureGroups)) continue;

        // Exclude NPC kills
        if (isset($k["zkb"]["npc"]) && $k["zkb"]["npc"] === true) continue;

        $time = strtotime($k["killmail_time"]);
        if ($time === false || $time < $minDate) continue;

        $allKills[] = $k;
    }
}

$totalKills = count($allKills);
$totalPages = max(1, ceil($totalKills / $perPage));

$offset = ($page - 1) * $perPage;
$pageKills = array_slice($allKills, $offset, $perPage);

$totalISK = array_sum(array_column($allKills, "zkb", "totalValue"));
$pageISK = array_sum(array_column($pageKills, "zkb", "totalValue"));

echo json_encode([
    "page" => $page,
    "total_pages" => $totalPages,
    "total_isk" => $totalISK,
    "page_isk" => $pageISK,
    "kills" => $pageKills
]);
