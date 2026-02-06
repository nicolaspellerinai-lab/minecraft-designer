class App {
    constructor() {
        this.canvas = new Canvas('main-canvas');
        this.history = new History(this);
        this.selection = new Selection(this.canvas);
        this.dragDrop = new DragDrop(this.canvas, this);
        this.transform = new Transform(this.canvas, this.selection);
        this.exporter = new Exporter(this.canvas);

        this.init();
        
        // Auto-save every 30 seconds
        setInterval(() => this.saveProjectToLocalStorage(), 30000);
    }

    init() {
        console.log('Initializing Minecraft Designer...');
        this.setupEventListeners();
        this.loadProjectFromLocalStorage();
        this.canvas.render();
        this.updateUI();
        this.populateAssetGrid();
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
        Utils.listen(Utils.qs('#load-project-btn'), 'click', ()_ => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = e => this.exporter.loadProjectFromFile(e.target.files[0]);
            input.click();
        });
        
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
        // Update status bar
        // This should be called whenever the state changes
        const elementCount = this.canvas.elements.length;
        const zoom = this.canvas.transform.scale;
        Utils.qs('#element-count').textContent = `Objets: ${elementCount}`;
        Utils.qs('#zoom-level').textContent = `Zoom: ${Math.round(zoom * 100)}%`;
    }
    
    clearCanvas() {
        if (confirm('Êtes-vous sûr de vouloir tout effacer ? Cette action est irréversible.')) {
            this.canvas.clear();
            this.history.clear();
            this.selection.clear();
            this.updateUI();
        }
    }

    populateAssetGrid() {
        const assetGrid = Utils.qs('#asset-grid');
        // This is a placeholder. In a real app you'd fetch this from a config file.
        const assets = {
            building: ['brick.png', 'cobblestone.png', 'crafting_table.png'],
            natural: ['dirt.png', 'grass.png', 'sand.png', 'stone.png', 'log.png'],
            // Add other assets here
        };

        // For now just add some dummy items
        for (let i = 0; i < 50; i++) {
            const item = document.createElement('div');
            item.className = 'asset-item';
            item.draggable = true;
            item.dataset.assetId = `item-${i}`;
            const img = document.createElement('img');
            img.src = 'https://via.placeholder.com/32'; // Placeholder image
            item.appendChild(img);
            assetGrid.appendChild(item);
        }
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

// Wait for the DOM to be fully loaded before starting the app
window.addEventListener('DOMContentLoaded', () => {
    const app = new App();
});
