<?php
if (!defined('DASHBOARD_ROOT')) { define('DASHBOARD_ROOT', dirname(__FILE__)); }
define('DB_HOST', 'localhost');
define('DB_NAME', 'lepetitweb_dashboard_oc');
define('DB_USER', 'lepetitweb_dashboard_oc_user');
define('DB_PASS', '0GALOu]gv]hu');

class Database {
  private static $instance = null;
  private $connection;
  public static function getInstance() {
    if (self::$instance === null) self::$instance = new self();
    return self::$instance;
  }
  private function __construct() {
    $this->connection = mysqli_connect(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if (!$this->connection) die('DB error: ' . mysqli_connect_error());
    mysqli_set_charset($this->connection, 'utf8mb4');
  }
  public function getConnection() { return $this->connection; }
  public function query($sql) { $r = mysqli_query($this->connection, $sql); if ($r === false) error_log('MySQL ERROR: ' . mysqli_error($this->connection)); return $r; }
  public function escape($s) { return mysqli_real_escape_string($this->connection, $s); }
  public function fetchAll($result) {
    $rows = array();
    while ($row = mysqli_fetch_assoc($result)) $rows[] = $row;
    return $rows;
  }
}

// Helper functions
function initDatabase() {
  $db = Database::getInstance();
  initSecurityTables();
  
  // Table Agents
  $db->query("CREATE TABLE IF NOT EXISTS agents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agent_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255),
    description TEXT,
    badge VARCHAR(50) DEFAULT 'secondary',
    icon VARCHAR(50) DEFAULT 'robot',
    primary_model VARCHAR(255),
    fallbacks TEXT,
    skills TEXT,
    is_system TINYINT DEFAULT 0,
    is_detected TINYINT DEFAULT 0,
    config_soul MEDIUMTEXT,
    config_user MEDIUMTEXT,
    config_tools MEDIUMTEXT,
    config_memory MEDIUMTEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
  
  // Messages table
  $db->query("CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    content TEXT,
    category VARCHAR(100),
    file_url VARCHAR(500),
    file_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
  // Kanban tables
  $db->query("CREATE TABLE IF NOT EXISTS kanban_tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id VARCHAR(50) UNIQUE,
    title VARCHAR(255),
    project VARCHAR(100),
    assignee VARCHAR(50),
    priority INT DEFAULT 2,
    notes TEXT,
    todo_list TEXT,
    done_list TEXT,
    status VARCHAR(50),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
}

function getMessagesDB() {
  $db = Database::getInstance();
  $result = $db->query("SELECT * FROM messages ORDER BY created_at DESC");
  return $result ? $db->fetchAll($result) : [];
}

function addMessageDB($title, $content, $category, $file_url, $file_name) {
  $db = Database::getInstance();
  $sql = sprintf("INSERT INTO messages (title, content, category, file_url, file_name) VALUES ('%s','%s','%s','%s','%s')",
    $db->escape($title), $db->escape($content), $db->escape($category), $db->escape($file_url), $db->escape($file_name));
  return $db->query($sql);
}

function deleteMessageDB($id) {
  $db = Database::getInstance();
  return $db->query(sprintf("DELETE FROM messages WHERE id=%d", (int)$id));
}

// Migration pour ajouter sort_order si manquant
function migrateKanbanSortOrder() {
  $db = Database::getInstance();
  $result = $db->query("SHOW COLUMNS FROM kanban_tasks LIKE 'sort_order'");
  if (!$result || mysqli_num_rows($result) == 0) {
    $db->query("ALTER TABLE kanban_tasks ADD COLUMN sort_order INT DEFAULT 0");
  }
}

// Kanban functions
function getKanbanDB() {
  migrateKanbanSortOrder(); // Auto-migration
  $db = Database::getInstance();
  $cols = ['enAttente','enCours','enValidation','completees'];
  $data = [];
  foreach ($cols as $col) {
    $result = $db->query(sprintf("SELECT * FROM kanban_tasks WHERE status='%s' ORDER BY sort_order ASC, created_at ASC", $db->escape($col)));
    $data[$col] = [];
    if ($result) {
      while ($row = mysqli_fetch_assoc($result)) {
        $data[$col][] = [
          'id' => $row['task_id'],
          'title' => $row['title'],
          'project' => $row['project'],
          'assignee' => $row['assignee'],
          'priority' => $row['priority'],
          'notes' => $row['notes'],
          'aFaire' => json_decode($row['todo_list'] ?? '[]', true),
          'effectues' => json_decode($row['done_list'] ?? '[]', true)
        ];
      }
    }
  }
  return $data;
}

function addKanbanTaskDB($task, $status) {
  $db = Database::getInstance();
  $id = $task['id'] ?? uniqid();
  $sql = sprintf("INSERT INTO kanban_tasks (task_id, title, project, assignee, priority, notes, todo_list, done_list, status) VALUES ('%s','%s','%s','%s',%d,'%s','%s','%s','%s')",
    $db->escape($id), $db->escape($task['title'] ?? ''), $db->escape($task['project'] ?? ''),
    $db->escape($task['assignee'] ?? 'Main'), (int)($task['priority'] ?? 2),
    $db->escape($task['notes'] ?? ''), $db->escape(json_encode($task['aFaire'] ?? [])),
    $db->escape(json_encode($task['effectues'] ?? [])), $db->escape($status));
  return $db->query($sql);
}

function updateKanbanTaskDB($task) {
  $db = Database::getInstance();
  $sql = sprintf("UPDATE kanban_tasks SET title='%s', project='%s', assignee='%s', priority=%d, notes='%s', todo_list='%s', done_list='%s' WHERE task_id='%s'",
    $db->escape($task['title'] ?? ''), $db->escape($task['project'] ?? ''), $db->escape($task['assignee'] ?? 'Main'),
    (int)($task['priority'] ?? 2), $db->escape($task['notes'] ?? ''),
    $db->escape(json_encode($task['aFaire'] ?? [])), $db->escape(json_encode($task['effectues'] ?? [])),
    $db->escape($task['id'] ?? ''));
  return $db->query($sql);
}

function updateKanbanTaskStatusDB($taskId, $newStatus) {
  $db = Database::getInstance();
  return $db->query(sprintf("UPDATE kanban_tasks SET status='%s' WHERE task_id='%s'", $db->escape($newStatus), $db->escape($taskId)));
}

function updateKanbanTaskOrderDB($taskId, $newOrder, $status) {
  $db = Database::getInstance();
  return $db->query(sprintf("UPDATE kanban_tasks SET sort_order=%d, status='%s' WHERE task_id='%s'", (int)$newOrder, $db->escape($status), $db->escape($taskId)));
}

function reorderKanbanColumnDB($status) {
  $db = Database::getInstance();
  $result = $db->query(sprintf("SELECT task_id FROM kanban_tasks WHERE status='%s' ORDER BY sort_order ASC, created_at ASC", $db->escape($status)));
  if (!$result) return;
  $order = 0;
  while ($row = mysqli_fetch_assoc($result)) {
    $db->query(sprintf("UPDATE kanban_tasks SET sort_order=%d WHERE task_id='%s'", $order++, $db->escape($row['task_id'])));
  }
}

function deleteKanbanTaskDB($taskId) {
  $db = Database::getInstance();
  return $db->query(sprintf("DELETE FROM kanban_tasks WHERE task_id='%s'", $db->escape($taskId)));
}

// ============ AGENTS FUNCTIONS ============
function getAgentsDB() {
  $db = Database::getInstance();
  $result = $db->query("SELECT * FROM agents ORDER BY is_system DESC, is_detected ASC, name ASC");
  $agents = [];
  if ($result) {
    while ($row = mysqli_fetch_assoc($result)) {
      $agents[$row['agent_id']] = [
        'id' => $row['agent_id'],
        'name' => $row['name'],
        'description' => $row['description'],
        'badge' => $row['badge'] ?? 'secondary',
        'icon' => $row['icon'] ?? 'robot',
        'primaryModel' => $row['primary_model'],
        'fallbacks' => json_decode($row['fallbacks'] ?? '[]', true),
        'skills' => json_decode($row['skills'] ?? '[]', true),
        'isSystem' => $row['is_system'] ? true : false,
        'isDetected' => $row['is_detected'] ? true : false,
        'files' => [
          'SOUL.md' => $row['config_soul'],
          'USER.md' => $row['config_user'],
          'TOOLS.md' => $row['config_tools'],
          'MEMORY.md' => $row['config_memory']
        ]
      ];
    }
  }
  return $agents;
}

function upsertAgentDB($agent) {
  $db = Database::getInstance();
  $id = $db->escape($agent['id'] ?? '');
  $name = $db->escape($agent['name'] ?? '');
  $desc = $db->escape($agent['description'] ?? '');
  $badge = $db->escape($agent['badge'] ?? 'secondary');
  $icon = $db->escape($agent['icon'] ?? 'robot');
  $model = $db->escape($agent['primaryModel'] ?? '');
  $fallbacks = $db->escape(json_encode($agent['fallbacks'] ?? []));
  $skills = $db->escape(json_encode($agent['skills'] ?? []));
  $isSystem = !empty($agent['isSystem']) ? 1 : 0;
  $isDetected = !empty($agent['isDetected']) ? 1 : 0;
  
  $sql = sprintf(
    "INSERT INTO agents (agent_id, name, `description`, badge, icon, primary_model, fallbacks, skills, is_system, is_detected, config_soul, config_user, config_tools, config_memory)
     VALUES ('%s','%s','%s','%s','%s','%s','%s','%s',%d,%d,NULL,NULL,NULL,NULL)
     ON DUPLICATE KEY UPDATE
     name='%s', `description`='%s', badge='%s', icon='%s', primary_model='%s', fallbacks='%s', skills='%s', is_system=%d, is_detected=%d, config_soul=VALUES(config_soul), config_user=VALUES(config_user), config_tools=VALUES(config_tools), config_memory=VALUES(config_memory)",
    $id, $name, $desc, $badge, $icon, $model, $fallbacks, $skills, $isSystem, $isDetected,
    $name, $desc, $badge, $icon, $model, $fallbacks, $skills, $isSystem, $isDetected
  );
  return $db->query($sql);
}

function updateAgentConfigDB($agentId, $configType, $content) {
  $db = Database::getInstance();
  $allowed = ['soul', 'user', 'tools', 'memory'];
  if (!in_array($configType, $allowed)) return false;
  
  $field = 'config_' . $configType;
  // Truncate si trop gros pour MEDIUMTEXT
  $content = $db->escape($content);
  return $db->query(sprintf("UPDATE agents SET %s='%s' WHERE agent_id='%s'", $field, $content, $db->escape($agentId)));
}

function migrateFromJson() { return true; }

// ============ SECURITY FUNCTIONS ============
function getClientIp() {
    $ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? ($_SERVER['HTTP_X_REAL_IP'] ?? ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0'));
    if (strpos($ip, ',') !== false) { $ips = explode(',', $ip); $ip = trim($ips[0]); }
    return filter_var($ip, FILTER_VALIDATE_IP) ?: '0.0.0.0';
}

function checkBlockedIP($db, $ip) {
    $esc = $db->escape($ip);
    $result = $db->query("SELECT blocked_until, reason FROM blocked_ips WHERE ip_address='{$esc}' AND blocked_until > NOW() LIMIT 1");
    return ($result && mysqli_num_rows($result) > 0) ? mysqli_fetch_assoc($result) : false;
}

function logAttempt($db, $ip, $success) {
    $escIp = $db->escape($ip);
    $userAgent = $db->escape($_SERVER['HTTP_USER_AGENT'] ?? 'unknown');
    $succ = $success ? 1 : 0;
    $db->query("INSERT INTO auth_attempts (ip_address, success, user_agent, endpoint, attempted_at) VALUES ('{$escIp}', {$succ}, '{$userAgent}', 'login', NOW())");
    if (!$success) {
        $result = $db->query("SELECT COUNT(*) as cnt FROM auth_attempts WHERE ip_address='{$escIp}' AND success=0 AND attempted_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)");
        $row = mysqli_fetch_assoc($result);
        return $row['cnt'];
    }
    return 0;
}

function blockIP($db, $ip, $reason) {
    $esc = $db->escape($ip);
    $reasonEsc = $db->escape($reason);
    $until = date('Y-m-d H:i:s', time() + 24*60*60);
    $db->query("INSERT INTO blocked_ips (ip_address, reason, blocked_until) VALUES ('{$esc}', '{$reasonEsc}', '{$until}') ON DUPLICATE KEY UPDATE reason='{$reasonEsc}', blocked_until='{$until}'");
}

// ============ CATEGORIES FUNCTIONS ============
function getCategoriesDB() {
  $db = Database::getInstance();
  // Créer table si n'existe pas
  $db->query("CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(50) DEFAULT 'primary',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_name (name)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
  
  // Insérer catégories par défaut si vide
  $result = $db->query("SELECT COUNT(*) as cnt FROM categories");
  $row = mysqli_fetch_assoc($result);
  if ($row['cnt'] == 0) {
    $defaults = [
      ['En attente', 'warning'],
      ['Référence', 'secondary'],
      ['Terminé', 'success'],
      ['Urgent', 'danger'],
      ['Idées', 'info']
    ];
    foreach ($defaults as $cat) {
      $db->query(sprintf("INSERT INTO categories (name, color) VALUES ('%s', '%s')",
        $db->escape($cat[0]), $db->escape($cat[1])));
    }
  }
  
  // Récupérer avec count
  $result = $db->query("SELECT c.*, COUNT(m.id) as message_count 
    FROM categories c 
    LEFT JOIN messages m ON m.category = c.name 
    GROUP BY c.id, c.name, c.color, c.created_at
    ORDER BY c.created_at");
  
  $cats = [];
  while ($row = mysqli_fetch_assoc($result)) {
    $cats[] = [
      'id' => $row['id'],
      'name' => $row['name'],
      'color' => $row['color'],
      'message_count' => $row['message_count']
    ];
  }
  return $cats;
}

function addCategoryDB($name, $color) {
  $db = Database::getInstance();
  return $db->query(sprintf(
    "INSERT INTO categories (name, color) VALUES ('%s', '%s') ON DUPLICATE KEY UPDATE color='%s'",
    $db->escape($name),
    $db->escape($color),
    $db->escape($color)
  ));
}

function deleteCategoryDB($id) {
  $db = Database::getInstance();
  // Vérifier si des messages utilisent cette catégorie
  $result = $db->query(sprintf("SELECT category FROM categories WHERE id=%d", (int)$id));
  if (!$result || !($row = mysqli_fetch_assoc($result))) return false;
  
  $catName = $row['category'];
  // Mettre les messages à "General" au lieu de supprimer
  $db->query(sprintf("UPDATE messages SET category='General' WHERE category='%s'", $db->escape($catName)));
  
  return $db->query(sprintf("DELETE FROM categories WHERE id=%d", (int)$id));
}

function isIpBlocked($ip) {
  $db = Database::getInstance();
  $result = $db->query(sprintf("SELECT blocked_until FROM blocked_ips WHERE ip_address='%s' AND blocked_until > NOW()", 
    $db->escape($ip)));
  if ($result && $row = mysqli_fetch_assoc($result)) {
    return $row['blocked_until'];
  }
  // Cleanup old blocks
  $db->query("DELETE FROM blocked_ips WHERE blocked_until <= NOW()");
  return false;
}

function logAuthAttempt($ip, $success, $userAgent, $endpoint) {
  $db = Database::getInstance();
  $successInt = $success ? 1 : 0;
  $db->query(sprintf("INSERT INTO auth_attempts (ip_address, success, user_agent, endpoint, attempted_at) 
    VALUES ('%s',%d,'%s','%s',NOW())",
    $db->escape($ip), $successInt, $db->escape($userAgent), $db->escape($endpoint)));
}

function countFailedAttempts($ip, $minutes) {
  $db = Database::getInstance();
  $since = date('Y-m-d H:i:s', time() - ($minutes * 60));
  $result = $db->query(sprintf("SELECT COUNT(*) as cnt FROM auth_attempts 
    WHERE ip_address='%s' AND success=0 AND attempted_at > '%s'",
    $db->escape($ip), $since));
  if ($result && $row = mysqli_fetch_assoc($result)) {
    return (int)$row['cnt'];
  }
  return 0;
}

function checkRateLimit($ip, $endpoint, $limit, $windowMinutes) {
  $db = Database::getInstance();
  $since = date('Y-m-d H:i:s', time() - ($windowMinutes * 60));
  $key = $ip . ':' . $endpoint;
  
  // Simple rate limit using requests table
  $result = $db->query(sprintf("SELECT COUNT(*) as cnt FROM rate_limits 
    WHERE ip_endpoint='%s' AND requested_at > '%s'",
    $db->escape($key), $since));
  
  if ($result && $row = mysqli_fetch_assoc($result)) {
    if ($row['cnt'] >= $limit) return false;
  }
  
  // Log request
  $db->query(sprintf("INSERT INTO rate_limits (ip_endpoint, requested_at) VALUES ('%s',NOW())",
    $db->escape($key)));
  
  // Cleanup old entries
  $db->query("DELETE FROM rate_limits WHERE requested_at < DATE_SUB(NOW(), INTERVAL 1 HOUR)");
  
  return true;
}

function initSecurityTables() {
  $db = Database::getInstance();
  
  $db->query("CREATE TABLE IF NOT EXISTS blocked_ips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,
    reason VARCHAR(255),
    blocked_until DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ip (ip_address),
    INDEX idx_until (blocked_until)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
  
  $db->query("CREATE TABLE IF NOT EXISTS auth_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,
    success TINYINT DEFAULT 0,
    user_agent VARCHAR(500),
    endpoint VARCHAR(100),
    attempted_at DATETIME,
    INDEX idx_ip_time (ip_address, attempted_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
  
  $db->query("CREATE TABLE IF NOT EXISTS rate_limits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ip_endpoint VARCHAR(200) NOT NULL,
    requested_at DATETIME,
    INDEX idx_endpoint_time (ip_endpoint, requested_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
}

// ============ WIDGET DATA FUNCTIONS ============
function getWidgetData($widgetType) {
  $db = Database::getInstance();
  $sql = sprintf("SELECT * FROM widget_data WHERE widget_type='%s' LIMIT 1", $db->escape($widgetType));
  $result = $db->query($sql);
  if ($result && mysqli_num_rows($result) > 0) return mysqli_fetch_assoc($result);
  return null;
}

function saveWidgetData($widgetType, $data, $refreshInterval = 86400) {
  $db = Database::getInstance();
  $jsonData = json_encode($data);
  $now = date('Y-m-d H:i:s');
  $existing = getWidgetData($widgetType);
  if ($existing) {
    $sql = sprintf("UPDATE widget_data SET data_json='%s', last_refresh='%s', refresh_interval=%d WHERE widget_type='%s'",
      $db->escape($jsonData), $db->escape($now), $refreshInterval, $db->escape($widgetType));
  } else {
    $sql = sprintf("INSERT INTO widget_data (widget_type, data_json, last_refresh, refresh_interval) VALUES ('%s', '%s', '%s', %d)",
      $db->escape($widgetType), $db->escape($jsonData), $db->escape($now), $refreshInterval);
  }
  return $db->query($sql);
}

function shouldRefreshWidget($widgetType) {
  $data = getWidgetData($widgetType);
  if (!$data) return true;
  return (time() - strtotime($data['last_refresh'])) > $data['refresh_interval'];
}

function initWidgetTable() {
  $db = Database::getInstance();
  return $db->query("CREATE TABLE IF NOT EXISTS widget_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    widget_type VARCHAR(50) NOT NULL UNIQUE,
    data_json LONGTEXT,
    last_refresh DATETIME,
    refresh_interval INT DEFAULT 86400,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX widget_type_idx (widget_type)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
}
?>
