<?php
function load_json($filePath) {
    if (!file_exists($filePath)) return ["structures" => []];
    $data = json_decode(file_get_contents($filePath), true);
    if (!is_array($data)) $data = ["structures" => []];
    return $data;
}
function save_json($filePath, $data) {
    file_put_contents($filePath, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}
?>