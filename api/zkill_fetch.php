<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

// Debug (désactivable)
error_reporting(E_ALL);
ini_set("display_errors", 1);

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

// Groupes = toutes les structures EVE
$structureGroups = [
    365,   // Citadelles Upwell
    1406,  // Engineering Complexes
    1404,  // Refineries
    1657,  // FLEX structures (Jump Gate, Cyno Jammer, Ansiblex…)
    839,   // Territorial Claim Units (TCU)
    840,   // Infrastructure Hubs (IHub)
    1040,  // Command Centers
    439,   // POS Control Towers
    404,   // POS Modules
    1071   // Upwell Service Modules
];

foreach ($regions as $region) {

    $url = "https://zkillboard.com/api/kills/regionID/$region/";

    // zKillboard OBLIGE un User-Agent
    $opts = [
        "http" => [
            "method" => "GET",
            "header" => "User-Agent: DroneLandsIntel/1.0\r\n"
        ]
    ];

    $context = stream_context_create($opts);
    $json = @file_get_contents($url, false, $context);

    if (!$json) continue;

    $data = json_decode($json, true);
    if (!is_array($data)) continue;

    foreach ($data as $k) {

        // ignore NPC
        if (isset($k["zkb"]["npc"]) && $k["zkb"]["npc"] === true) continue;

        $time = strtotime($k["killmail_time"]);
        if ($time < $minDate) continue;

        // check group_id (structure identification)
        $groupID = $k["victim"]["group_id"] ?? null;
        if (!$groupID) continue;

        if (!in_array($groupID, $structureGroups)) continue;

        $allKills[] = $k;
    }
}

// Tri par date DESC (plus récent d'abord)
usort($allKills, function($a, $b) {
    return strtotime($b["killmail_time"]) - strtotime($a["killmail_time"]);
});

$totalKills = count($allKills);
$totalPages = max(1, ceil($totalKills / $perPage));

$offset = ($page - 1) * $perPage;
$pageKills = array_slice($allKills, $offset, $perPage);

// Calcul ISK
$totalISK = array_sum(array_column(array_map(fn($k) => $k["zkb"]["totalValue"] ?? 0, $allKills), 0));
$pageISK  = array_sum(array_column(array_map(fn($k) => $k["zkb"]["totalValue"] ?? 0, $pageKills), 0));

echo json_encode([
    "page" => $page,
    "total_pages" => $totalPages,
    "total_isk" => $totalISK,
    "page_isk" => $pageISK,
    "kills" => $pageKills
]);
