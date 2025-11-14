<?php
header("Content-Type: application/json");

$cacheFile = __DIR__ . "/../cache/kills.json";

if (!file_exists($cacheFile)) {
    echo json_encode(["error" => "Cache missing"]);
    exit;
}

$allKills = json_decode(file_get_contents($cacheFile), true);

$page = isset($_GET["page"]) ? intval($_GET["page"]) : 1;
$perPage = 50;

$totalKills = count($allKills);
$totalPages = ceil($totalKills / $perPage);

$offset = ($page - 1) * $perPage;
$pageKills = array_slice($allKills, $offset, $perPage);

// Calcul ISK totals
$totalISK = array_sum(array_map(fn($k)=>$k["zkb"]["totalValue"] ?? 0, $allKills));
$pageISK  = array_sum(array_map(fn($k)=>$k["zkb"]["totalValue"] ?? 0, $pageKills));

echo json_encode([
    "page" => $page,
    "total_pages" => $totalPages,
    "total_isk" => $totalISK,
    "page_isk" => $pageISK,
    "kills" => $pageKills
], JSON_PRETTY_PRINT);
