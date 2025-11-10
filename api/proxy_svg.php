<?php
// === proxy_svg.php ===
// Permet de récupérer un SVG Dotlan côté serveur sans CORS ===

header("Content-Type: image/svg+xml; charset=UTF-8");
header("Access-Control-Allow-Origin: *");

$url = $_GET['url'] ?? '';

if (!$url || !preg_match('/^https:\/\/evemaps\.dotlan\.net\/svg\/[A-Za-z0-9_\-]+\.svg$/', $url)) {
    http_response_code(400);
    echo "Invalid or missing SVG URL";
    exit;
}

$context = stream_context_create([
    'http' => [
        'timeout' => 5,
        'header' => "User-Agent: StructureMapBot/1.0\r\n"
    ]
]);

$data = @file_get_contents($url, false, $context);

if ($data === false) {
    http_response_code(502);
    echo "Failed to fetch remote SVG";
    exit;
}

echo $data;
