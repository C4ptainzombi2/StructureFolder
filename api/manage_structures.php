<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

$DATA_FILE = __DIR__ . "/../data/structures.json";

function load_json($file) {
    if (!file_exists($file)) return ["structures" => []];
    $data = json_decode(file_get_contents($file), true);
    if (!is_array($data)) $data = ["structures" => []];
    if (!isset($data["structures"])) $data["structures"] = [];
    return $data;
}
function save_json($file, $data) {
    file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}
$method = $_SERVER["REQUEST_METHOD"];
if ($method === "OPTIONS") exit(http_response_code(204));

if ($method === "GET") { echo json_encode(load_json($DATA_FILE)); exit; }

if ($method === "POST") {
    $input = json_decode(file_get_contents("php://input"), true);
    if (!$input || !isset($input["action"])) { echo json_encode(["success"=>false,"error"=>"Requête invalide"]); exit; }
    $data = load_json($DATA_FILE);
    $structures = &$data["structures"];
    $action = $input["action"];
    if ($action === "replace_or_add" && isset($input["data"])) {
        $new = $input["data"];
        $sys = strtolower(trim($new["Nom du système"] ?? ""));
        $name = strtolower(trim($new["Nom de la structure"] ?? ""));
        if (!$sys || !$name) { echo json_encode(["success"=>false,"error"=>"Nom du système ou structure manquant"]); exit; }
        $foundIndex = -1;
        foreach ($structures as $i => $s) {
            if (strtolower(trim($s["Nom du système"] ?? "")) === $sys && strtolower(trim($s["Nom de la structure"] ?? "")) === $name) { $foundIndex = $i; break; }
        }
        if ($foundIndex >= 0) { $structures[$foundIndex] = $new; save_json($DATA_FILE, $data); echo json_encode(["success"=>true,"replaced"=>true]); }
        else { $structures[] = $new; save_json($DATA_FILE, $data); echo json_encode(["success"=>true,"added"=>true]); }
        exit;
    }
    if ($action === "delete" && isset($input["system"], $input["name"])) {
        $sys = strtolower(trim($input["system"])); $name = strtolower(trim($input["name"]));
        $countBefore = count($structures);
        $structures = array_values(array_filter($structures, fn($s)=> strtolower(trim($s["Nom du système"]??""))!==$sys || strtolower(trim($s["Nom de la structure"]??""))!==$name));
        save_json($DATA_FILE,$data);
        echo json_encode(["success"=>count($structures)<$countBefore]); exit;
    }
    echo json_encode(["success"=>false,"error"=>"Action inconnue"]); exit;
}
?>