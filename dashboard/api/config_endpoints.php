<?php
// API Endpoints - Config & Health
switch ($path) {
  case 'config/update':
    if ($method === 'POST') {
      $cfg = loadConfig();
      foreach (['app_name','app_short_name','logo_url','logo_icon'] as $k) {
        if (isset($input[$k])) $cfg[$k] = $input[$k];
      }
      if (!empty($input['password'])) $cfg['password'] = $input['password'];
      jsonResponse(saveConfig($cfg), $cfg, 'Config mise a jour');
    }
    break;

  case 'health':
    jsonResponse(true, ['status'=>'ok','time'=>time()]);
    break;

  case 'admin/purge-cache':
    // Purge OPcache + apc
    $result = [];
    if (function_exists('opcache_reset')) {
      $result['opcache'] = opcache_reset();
    }
    if (function_exists('apc_clear_cache')) {
      $result['apc'] = apc_clear_cache();
    }
    if (function_exists('apcu_clear_cache')) {
      $result['apcu'] = apcu_clear_cache();
    }
    // Also clear file-based template caches if any
    $cacheDir = __DIR__ . '/../data/cache';
    if (is_dir($cacheDir)) {
      array_map('unlink', glob($cacheDir . '/*'));
      $result['file_cache'] = 'cleared';
    }
    jsonResponse(true, $result, 'Cache purge OK');
    break;
  
  default:
    jsonResponse(false, null, 'Endpoint config inconnu');
}
?>
