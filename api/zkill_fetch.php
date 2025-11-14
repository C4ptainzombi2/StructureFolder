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

// Liste réelle des structures Upwell
$structureIDs = [
    35825, // Raitaru
    35826, // Azbel
    35827, // Tatara
    35832, // Astrahus
    35833, // Fortizar
    35834, // Keepstar
    35835, // Athanor
    47512, // Ansiblex
    35836, // Sotiyo
    47513, // Tenebrex Cyno Jammer
    47514  // Pharolux Cyno Beacon
];

foreach ($regions as $region) {

    // On récupère plusieurs pages pour éviter la limite 200 kills
    for ($p = 1; $p <= 10; $p++) {

        $url = "https://zkillboard.com/api/kills/regionID/$region/page/$p/?no-attackers";

        $opts = [
            "http" => [
                "method" => "GET",
                "header" => "User-Agent: MyStructureFetcher/1.0\r\n"
            ]
        ];

        $context = stream_context_create($opts);
        $json = @file_get_contents($url, false, $context);

        if (!$json) continue;

        $data = json_decode($json, true);
        if (!is_array($data) || count($data) === 0) break;

        foreach ($data as $k) {
            $time = strtotime($k["killmail_time"]);

            if ($time >= $minDate) {
                $shipID = $k["victim"]["ship_type_id"] ?? 0;

                if (in_array($shipID, $structureIDs)) {
                    $allKills[] = $k;
                }
            }
        }
    }
}

$totalKills = count($allKills);
$totalPages = ceil($totalKills / $perPage);

$offset = ($page - 1) * $perPage;
$pageKills = array_slice($allKills, $offset, $perPage);

$totalISK = array_sum(array_column(array_filter($allKills, fn($k)=>isset($k['zkb']['totalValue'])), "zkb.totalValue"));
$pageISK = array_sum(array_column(array_filter($pageKills, fn($k)=>isset($k['zkb']['totalValue'])), "zkb.totalValue"));

echo json_encode([
    "page" => $page,
    "total_pages" => $totalPages,
    "total_isk" => $totalISK,
    "page_isk" => $pageISK,
    "kills" => $pageKills
]);
