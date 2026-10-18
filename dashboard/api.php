<?php
/**
 * OpenClaw Dashboard API
 * Routeur vers api/index.php
 */

// Reset OPcache
if (function_exists('opcache_reset')) opcache_reset();
if (function_exists('opcache_get_status')) {
    $status = opcache_get_status(false);
    error_log('OPcache: ' . json_encode(['version' => $status['opcache_statistics']['opcache_version'] ?? 'n/a', 'memory' => $status['memory_usage']['used_memory'] ?? 0]));
}

// Inline debug route to bypass all include caching
$path = $_GET['path'] ?? '';

if ($path === 'agents/debug2') {
    header('Content-Type: application/json');
    require_once __DIR__ . '/config.php';
    require_once __DIR__ . '/database.php';
    initDatabase();
    $db = Database::getInstance();
    $conn = $db->getConnection();
    
    $tables = $db->query("SHOW TABLES")->fetch_all(MYSQLI_NUM);
    
    $id = 'dbg2_' . time();
    $sql = "INSERT INTO agents (agent_id, name, `description`, badge, icon, primary_model, fallbacks, skills, is_system, is_detected, config_soul, config_user, config_tools, config_memory) VALUES ('{$id}','DBG','test','sec','bot','m','[]','[]',0,0,'','','','')";
    $r = $db->query($sql);
    
    echo json_encode([
        'result' => $r ? 'OK' : 'FAIL',
        'mysql_error' => mysqli_error($conn),
        'mysql_errno' => mysqli_errno($conn),
        'id' => $id,
        'tables' => $tables
    ]);
    exit;
}

// Normal routing
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/database.php';
initDatabase();
require_once __DIR__ . '/api/index.php';
