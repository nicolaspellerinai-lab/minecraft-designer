class App {
    constructor() {
        this.canvas = new Canvas('main-canvas');
        this.history = new History(this);
        this.selection = new Selection(this.canvas);
        this.dragDrop = new DragDrop(this.canvas, this);
        this.transform = new Transform(this.canvas, this.selection);
        this.exporter = new Exporter(this.canvas);

        // Set window.app BEFORE init() so export.js can access it
        window.app = this;

        this.init();
        
        // Auto-save every 30 seconds
        setInterval(() => this.saveProjectToLocalStorage(), 30000);
    }

    init() {
        console.log('Initializing Minecraft Designer...');
        this.renderCategories();
        this.setupEventListeners();
        this.loadProjectFromLocalStorage();
        this.canvas.render();
        this.updateUI();
        
        // Load first category by default
        const firstCategory = Object.keys(MINECRAFT_ASSETS.categories)[0] || 'building';
        this.populateAssetGrid(firstCategory);
    }

    renderCategories() {
        const categoryTabs = Utils.qs('#category-tabs');
        if (!categoryTabs || !MINECRAFT_ASSETS.categories) return;

        categoryTabs.innerHTML = '';
        
        Object.entries(MINECRAFT_ASSETS.categories).forEach(([id, cat], index) => {
            // Only show category if it has items (check both cat.items and if it's an array)
            const hasItems = cat.items && Array.isArray(cat.items) && cat.items.length > 0;
            if (!hasItems) return;

            const tab = document.createElement('div');
            tab.className = 'category-tab';
            tab.dataset.category = id;
            tab.title = cat.name;

            const icon = document.createElement('i');
            const iconClass = cat.icon ? (cat.icon.startsWith('fa-') ? `fas ${cat.icon}` : cat.icon) : 'fas fa-cube';
            icon.className = iconClass;

            const label = document.createElement('span');
            label.textContent = cat.name;

            tab.appendChild(icon);
            tab.appendChild(label);
            categoryTabs.appendChild(tab);
        });

        // Set first visible tab as active
        const firstTab = categoryTabs.querySelector('.category-tab');
        if (firstTab) firstTab.classList.add('active');
    }
    
    setupEventListeners() {
        Utils.listen(window, 'resize', Utils.debounce(() => this.canvas.resize(), 250));

        // Toolbar buttons
        Utils.listen(Utils.qs('#undo-btn'), 'click', () => this.history.undo());
        Utils.listen(Utils.qs('#redo-btn'), 'click', () => this.history.redo());
        Utils.listen(Utils.qs('#grid-toggle-btn'), 'click', () => this.canvas.toggleGrid());
        Utils.listen(Utils.qs('#clear-btn'), 'click', () => this.clearCanvas());

        // Export buttons
        Utils.listen(Utils.qs('#save-png-btn'), 'click', () => this.exporter.exportToPNG());
        Utils.listen(Utils.qs('#save-project-btn'), 'click', () => this.exporter.saveProjectToFile());
        Utils.listen(Utils.qs('#load-project-btn'), 'click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = e => this.exporter.loadProjectFromFile(e.target.files[0]);
            input.click();
        });
        
        // Category tabs
        const categoryTabs = Utils.qs('#category-tabs');
        if (categoryTabs) {
            Utils.listen(categoryTabs, 'click', (e) => {
                const tab = e.target.closest('.category-tab');
                if (tab) {
                    const category = tab.dataset.category;
                    this.populateAssetGrid(category);
                    
                    // Update active state
                    categoryTabs.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                }
            });
        }
        
        // Keyboard shortcuts
        Utils.listen(document, 'keydown', (e) => this.handleKeyPress(e));
        
        // Context Menu
        this.setupContextMenu();
    }
    
    handleKeyPress(e) {
        if (e.ctrlKey && e.key === 'z') {
            this.history.undo();
        } else if (e.ctrlKey && e.key === 'y') {
            this.history.redo();
        } else if (e.key === 'g') {
            this.canvas.toggleGrid();
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
            const selected = this.selection.getSelected();
            if(selected.length > 0) {
                 const command = new RemoveElementCommand(this.canvas, selected);
                 this.history.add(command);
                 this.selection.clear();
            }
        }
    }

    setupContextMenu() {
        const contextMenu = Utils.qs('#context-menu');
        Utils.listen(this.canvas.canvas, 'contextmenu', e => {
            e.preventDefault();
            const { clientX: mouseX, clientY: mouseY } = e;
            contextMenu.style.display = 'block';
            contextMenu.style.left = `${mouseX}px`;
            contextMenu.style.top = `${mouseY}px`;
        });

        Utils.listen(document, 'click', () => {
            contextMenu.style.display = 'none';
        });
    }

    updateUI() {
        const elementCount = this.canvas.elements.length;
        const zoom = this.canvas.transform.scale;
        Utils.qs('#element-count').textContent = `Objets: ${elementCount}`;
        Utils.qs('#zoom-level').textContent = `Zoom: ${Math.round(zoom * 100)}%`;
    }
    
    clearCanvas() {
        if (confirm('Êtes-vous sûr de vouloir tout effacer ?')) {
            this.canvas.clear();
            this.history.clear();
            this.selection.clear();
            this.updateUI();
        }
    }

    populateAssetGrid(category) {
        const assetGrid = Utils.qs('#asset-grid');
        assetGrid.innerHTML = '';
        
        if (typeof MINECRAFT_ASSETS === 'undefined') {
            console.error('MINECRAFT_ASSETS not loaded');
            return;
        }
        
        let items = [];
        
        if (MINECRAFT_ASSETS.categories && MINECRAFT_ASSETS.categories[category]) {
            items = MINECRAFT_ASSETS.categories[category].items || [];
        }
        
        if (items.length === 0) {
            console.warn('No items found for category:', category);
            return;
        }
        
        items.forEach(asset => {
            const item = document.createElement('div');
            item.className = 'asset-item';
            item.draggable = true;
            item.dataset.assetId = asset.id;
            item.dataset.assetPath = asset.path;
            item.dataset.assetName = asset.name;
            item.title = asset.name;
            
            const img = document.createElement('img');
            img.src = asset.path;
            img.alt = asset.name;
            img.loading = 'lazy';
            img.draggable = false; // Prevent browser default image drag
            
            img.onerror = () => {
                console.warn('Failed to load:', asset.path);
                img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32"%3E%3Crect fill="%23ff00ff" width="32" height="32"/%3E%3Ctext x="16" y="20" text-anchor="middle" font-size="8" fill="white"%3E?%3C/text%3E%3C/svg%3E';
            };
            
            item.appendChild(img);
            
            assetGrid.appendChild(item);
        });
    }
    
    saveProjectToLocalStorage() {
        try {
            const projectData = this.exporter.getProjectData();
            localStorage.setItem('minecraftDesigner_autosave', projectData);
            console.log('Project auto-saved to localStorage.');
        } catch(e) {
            console.error('Failed to save project to localStorage:', e);
        }
    }
    
    loadProjectFromLocalStorage() {
        try {
            const projectData = localStorage.getItem('minecraftDesigner_autosave');
            if(projectData) {
                this.exporter.loadProjectData(projectData);
                console.log('Project loaded from localStorage.');
            }
        } catch(e) {
            console.error('Failed to load project from localStorage:', e);
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const app = new App();
});