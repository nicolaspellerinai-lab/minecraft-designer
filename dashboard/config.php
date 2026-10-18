<?php
/**
 * OpenClaw Dashboard - Configuration centrale
 * Combine MessageBoard et Kanban
 */

// Debug - Afficher les erreurs
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Empêcher l'accès direct
if (!defined('DASHBOARD_ROOT')) {
    define('DASHBOARD_ROOT', dirname(__FILE__));
}

// Fichier de configuration persistant
define('CONFIG_FILE', DASHBOARD_ROOT . '/data/config.json');

// Configuration par défaut
function getDefaultConfig() {
    return [
        // Infos application (modifiable via page config)
        'app_name' => 'OpenClaw Dashboard',
        'app_short_name' => 'Dashboard',
        'logo_url' => 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/svgs/solid/paw.svg',
        'logo_icon' => 'fa-paw', // Classe FontAwesome
        'footer_text' => '&copy; ' . date('Y') . ' OpenClaw',
        
        // Sécurité
        'password' => 'ClawdBot123!!!',
        'session_name' => 'openclaw_dashboard',
        'session_expire' => 3600, // 1 heure
        
        // Chemins
        'data_dir' => DASHBOARD_ROOT . '/data',
        
        // Modules actifs
        'modules' => [
            'messageboard' => [
                'enabled' => true,
                'name' => 'MessageBoard',
                'icon' => '💬',
                'data_file' => 'messages.json'
            ],
            'kanban' => [
                'enabled' => true,
                'name' => 'Kanban',
                'icon' => '📋',
                'data_file' => 'kanban.json'
            ],
            'memory' => [
                'enabled' => true,
                'name' => 'Memoire',
                'icon' => '🧠',
                'data_file' => null
            ],
            'agents' => [
                'enabled' => true,
                'name' => 'Agents',
                'icon' => '🤖',
                'data_file' => null
            ],
            'cron' => [
                'enabled' => true,
                'name' => 'Cron',
                'icon' => '⏰',
                'data_file' => null
            ],
            'usage' => [
                'enabled' => true,
                'name' => 'Utilisation',
                'icon' => '📊',
                'data_file' => null
            ],
            'configurations' => [
                'enabled' => true,
                'name' => 'Configurations',
                'icon' => '⚙️',
                'data_file' => null,
                'hidden' => false // Ne pas afficher dans le menu principal
            ]
        ],
        
        // API settings
        'api' => [
            'rate_limit' => 100,
            'cors_origin' => '*',
            'auth_required' => true
        ],
        
        // Apparence
        'theme' => [
            'primary_color' => '#2c3e50',
            'accent_color' => '#3498db',
            'sidebar_width' => '250px'
        ]
    ];
}

// Charger la config depuis le fichier ou utiliser les valeurs par défaut
function loadConfig() {
/*
    if (file_exists(CONFIG_FILE)) {
        $saved = json_decode(file_get_contents(CONFIG_FILE), true);
        if ($saved && is_array($saved)) {
            // Fusionner avec les valeurs par défaut pour garantir toutes les clés
            return array_merge(getDefaultConfig(), $saved);
        }
    }
*/        
    return getDefaultConfig();
}

// Sauvegarder la config
function saveConfig($cfg) {
    // Créer le dossier data si nécessaire
    if (!is_dir(dirname(CONFIG_FILE))) {
        mkdir(dirname(CONFIG_FILE), 0755, true);
    }
    return file_put_contents(CONFIG_FILE, json_encode($cfg, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

// Config globale
$config = loadConfig();

// Créer le répertoire data s'il n'existe pas
if (!is_dir($config['data_dir'])) {
    mkdir($config['data_dir'], 0755, true);
}

// Gestion de session sécurisée
function initSession() {
    global $config;
    if (session_status() === PHP_SESSION_NONE) {
        ini_set('session.cookie_httponly', 1);
        ini_set('session.cookie_secure', 1);
        ini_set('session.gc_maxlifetime', $config['session_expire']);
        session_name($config['session_name']);
        session_start();
    }
    
    // Vérifier expiration
    if (isset($_SESSION['last_activity']) && (time() - $_SESSION['last_activity'] > $config['session_expire'])) {
        session_unset();
        session_destroy();
        return false;
    }
    $_SESSION['last_activity'] = time();
    return true;
}

// Vérifier si l'utilisateur est logué
function isLoggedIn() {
    initSession();
    return isset($_SESSION['authenticated']) && $_SESSION['authenticated'] === true;
}

// Authentification
function login($password) {
    global $config;
    if ($password === $config['password']) {
        $_SESSION['authenticated'] = true;
        $_SESSION['last_activity'] = time();
        return true;
    }
    return false;
}

function logout() {
    session_unset();
    session_destroy();
}

// Fonction utilitaire pour charger les données JSON
define('DATA_DIR', $config['data_dir']);
function loadData($file) {
    $path = DATA_DIR . '/' . $file;
    if (file_exists($path)) {
        $content = file_get_contents($path);
        return json_decode($content, true) ?: [];
    }
    return [];
}

// Fonction utilitaire pour sauvegarder les données JSON
function saveData($file, $data) {
    $path = DATA_DIR . '/' . $file;
    file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    return true;
}

// Authentification API
function checkApiAuth() {
    global $config;
    
    // Vérifier session d'abord (si appel depuis le même domaine)
    initSession();
    if (isset($_SESSION['authenticated']) && $_SESSION['authenticated'] === true) {
        return true;
    }
    
    // Sinon vérifier header X-Auth-Password
    $headers = getallheaders();
    $auth = isset($headers['X-Auth-Password']) ? $headers['X-Auth-Password'] : 
            (isset($_SERVER['HTTP_X_AUTH_PASSWORD']) ? $_SERVER['HTTP_X_AUTH_PASSWORD'] : '');
    
    if ($auth === $config['password']) {
        return true;
    }
    
    return false;
}

// Réponse JSON standardisée
function jsonResponse($success, $data = null, $message = '') {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => $success,
        'data' => $data,
        'message' => $message,
        'timestamp' => time()
    ], JSON_PRETTY_PRINT);
    exit;
}

// Générer le titre de page
function getPageTitle($page = 'home', $moduleName = '') {
    global $config;
    $app = $config['app_short_name'];
    
    if ($page === 'home') {
        return $app;
    }
    
    if ($moduleName) {
        return $app . ' - ' . $moduleName;
    }
    
    return $app;
}
?>