<?php
/**
 * API Router - OpenClaw Dashboard (SÉCURISÉ)
 */

// 1. Reset OPcache to ensure fresh uploads take effect
if (function_exists('opcache_reset')) opcache_reset();

// 1. Sécurité renforcée
require_once __DIR__ . '/secure_check.php';

// Debug
error_reporting(E_ALL);
ini_set('display_errors', 1);

// 2. Core
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../database.php';

// Initialiser les tables si nécessaire
initDatabase();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: ' . ($_SERVER['HTTP_ORIGIN'] ?? '*'));
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Auth-Password, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

// Auth déjà vérifiée par secure_check.php

$path = $_GET['path'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true) ?: [];

// Helper JSON
function jsonResponse($success, $data = null, $message = '') {
    echo json_encode(['success' => $success, 'data' => $data, 'message' => $message, 'timestamp' => time()]);
    exit;
}

// Routing
switch (true) {
  case strpos($path, 'messages') === 0:
    require_once __DIR__ . '/messages.php';
    break;
  case strpos($path, 'kanban') === 0:
    require_once __DIR__ . '/kanban.php';
    break;
  case strpos($path, 'categories') === 0:
    require_once __DIR__ . '/categories.php';
    break;
  case strpos($path, 'widget') === 0:
    require_once __DIR__ . '/widget.php';
    break;
  case strpos($path, 'agents/debug') === 0:
    // Inline debug to bypass include caching
    $db = Database::getInstance();
    $conn = $db->getConnection();
    $id = 'debug_' . time();
    $sql = "INSERT INTO agents (agent_id, name, `description`, badge, icon, primary_model, fallbacks, skills, is_system, is_detected) VALUES ('{$id}','Nom','Desc','sec','bot','model','[]','[]',0,0)";
    $r = $db->query($sql);
    jsonResponse($r, ['query' => $sql, 'mysql_error' => mysqli_error($conn)], $r ? 'OK' : 'Erreur');
    break;
  case strpos($path, 'agents') === 0:
    require_once __DIR__ . '/agents.php';
    break;
  case $path === 'health':
  case strpos($path, 'config') === 0:
    require_once __DIR__ . '/config_endpoints.php';
    break;
  default:
    jsonResponse(false, null, 'Endpoint inconnu: ' . $path);
}
?>
