<?php
// === CONFIG DEBUG SERVEUR ===
define("DEBUG_MODE", true); // mettre false en production
define("LOG_FILE", __DIR__ . "/../logs/structures.log");

if (!is_dir(dirname(LOG_FILE))) {
    mkdir(dirname(LOG_FILE), 0777, true);
}

function debug_log($message) {
    if (!DEBUG_MODE) return;
    $date = date('[Y-m-d H:i:s]');
    file_put_contents(LOG_FILE, "$date $message\n", FILE_APPEND);
}
?>