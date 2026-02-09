<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Minecraft Designer</title>
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
</head>
<body>
    <header class="main-header">
        <h1>Minecraft Designer</h1>
        <div class="main-controls">
            <!-- Main controls here -->
        </div>
    </header>

    <main class="main-content">
        <aside class="sidebar">
            <div class="sidebar-header">
                <input type="text" id="search-bar" placeholder="Rechercher des objets...">
            </div>
            <div id="category-tabs">
                <div class="category-tab" data-category="building">
                    <i class="fas fa-cube"></i> <span>Bâtiment</span>
                </div>
                <div class="category-tab" data-category="natural">
                    <i class="fas fa-tree"></i> <span>Naturel</span>
                </div>
                <div class="category-tab" data-category="tools">
                    <i class="fas fa-wrench"></i> <span>Outils</span>
                </div>
                <div class="category-tab" data-category="food">
                    <i class="fas fa-apple-alt"></i> <span>Nourriture</span>
                </div>
                <div class="category-tab" data-category="creatures">
                    <i class="fas fa-paw"></i> <span>Créatures</span>
                </div>
                <div class="category-tab" data-category="redstone">
                    <i class="fas fa-toggle-on"></i> <span>Redstone</span>
                </div>
                <div class="category-tab" data-category="decorations">
                    <i class="fas fa-couch"></i> <span>Décorations</span>
                </div>
                <div class="category-tab" data-category="accessories">
                    <i class="fas fa-gem"></i> <span>Accessoires</span>
                </div>
                <div class="category-tab" data-category="plants">
                    <i class="fas fa-leaf"></i> <span>Plantes</span>
                </div>
                <div class="category-tab" data-category="transport">
                    <i class="fas fa-train"></i> <span>Transport</span>
                </div>
                 <div class="category-tab" data-category="favorites">
                    <i class="fas fa-star"></i> <span>Favoris</span>
                </div>
            </div>
            <div id="asset-grid">
                <!-- Draggable assets will be loaded here -->
            </div>
        </aside>

        <div class="canvas-container">
            <canvas id="main-canvas" width="1200" height="800"></canvas>
        </div>

        <aside class="properties-panel">
            <h3>Propriétés</h3>
            <div id="properties-content">
                <p>Aucun objet sélectionné</p>
            </div>
        </aside>
    </main>

    <footer class="bottom-toolbar">
        <button id="undo-btn"><i class="fas fa-undo"></i> Annuler</button>
        <button id="redo-btn"><i class="fas fa-redo"></i> Rétablir</button>
        <button id="grid-toggle-btn"><i class="fas fa-th"></i> Grille</button>
        <button id="save-png-btn"><i class="fas fa-save"></i> Enregistrer PNG</button>
        <button id="save-project-btn"><i class="fas fa-file-export"></i> Enregistrer Projet</button>
        <button id="load-project-btn"><i class="fas fa-file-import"></i> Charger Projet</button>
        <button id="clear-btn"><i class="fas fa-trash"></i> Effacer</button>
    </footer>

    <div class="status-bar">
        <div id="coords">X: 0, Y: 0</div>
        <div id="element-count">Objets: 0</div>
        <div id="zoom-level">Zoom: 100%</div>
    </div>
    
    <div id="context-menu" class="context-menu">
        <ul>
            <li id="ctx-copy">Copier</li>
            <li id="ctx-paste">Coller</li>
            <li id="ctx-delete">Supprimer</li>
            <li id="ctx-duplicate">Dupliquer</li>
            <li id="ctx-lock">Verrouiller</li>
        </ul>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    <script src="assets-data.js?t=<?php echo date("YmdHis"); ?>"></script>
    <script src="utils.js?t=<?php echo date("YmdHis"); ?>"></script>
    <script src="history.js?t=<?php echo date("YmdHis"); ?>"></script>
    <script src="transform.js?t=<?php echo date("YmdHis"); ?>"></script>
    <script src="selection.js?t=<?php echo date("YmdHis"); ?>"></script>
    <script src="dragdrop.js?t=<?php echo date("YmdHis"); ?>"></script>
    <script src="canvas.js?t=<?php echo date("YmdHis"); ?>"></script>
    <script src="export.js?t=<?php echo date("YmdHis"); ?>"></script>
    <script src="app.js?t=<?php echo date("YmdHis"); ?>"></script>
</body>
</html>
