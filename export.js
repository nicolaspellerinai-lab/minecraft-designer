class Exporter {
    constructor(canvasInstance) {
        this.canvas = canvasInstance;
    }

    // --- PNG Export ---

    exportToPNG() {
        // Options can be added here for resolution, transparent bg etc.
        html2canvas(this.canvas.canvas.parentElement, { 
            backgroundColor: null, // for transparent background
            useCORS: true // if you use external images
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = 'minecraft-design.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        }).catch(err => {
            console.error('Oops, something went wrong with PNG export!', err);
            alert('Erreur lors de l\'exportation en PNG.');
        });
    }

    // --- Project Save/Load ---

    getProjectData() {
        // We need to serialize the elements in a way that can be rebuilt
        const project = {
            elements: this.canvas.elements.map(el => ({
                id: el.id,
                assetId: el.assetId,
                x: el.x,
                y: el.y,
                width: el.width,
                height: el.height,
                rotation: el.rotation || 0,
                scale: el.scale || 1,
                zIndex: el.zIndex || 0,
                // We don't save the image object, just the source
                imageSrc: el.image.src 
            })),
            transform: this.canvas.transform,
            grid: {
                isVisible: this.canvas.isGridVisible,
                size: this.canvas.gridSize
            }
        };
        return JSON.stringify(project, null, 2);
    }
    
    saveProjectToFile() {
        try {
            const projectData = this.getProjectData();
            const blob = new Blob([projectData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = 'minecraft-project.json';
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
        } catch(e) {
            console.error('Failed to save project:', e);
            alert('Erreur lors de l\'enregistrement du projet.');
        }
    }
    
    loadProjectFromFile(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                this.loadProjectData(e.target.result);
            } catch (err) {
                 console.error('Failed to load project file:', err);
                 alert('Fichier de projet invalide ou corrompu.');
            }
        };
        reader.onerror = () => {
             console.error('Error reading file:', reader.error);
             alert('Impossible de lire le fichier.');
        }
        reader.readAsText(file);
    }
    
    loadProjectData(jsonData) {
        const project = JSON.parse(jsonData);
        
        // Clear current state
        this.canvas.clear();
        window.app.history.clear();
        window.app.selection.clear();
        
        // Load new state
        this.canvas.transform = project.transform;
        this.canvas.isGridVisible = project.grid.isVisible;
        this.canvas.gridSize = project.grid.size;

        // Recreate elements
        const elementsToLoad = project.elements.length;
        let elementsLoaded = 0;
        
        if(elementsToLoad === 0) {
            this.canvas.render();
            window.app.updateUI();
            return;
        }

        project.elements.forEach(elData => {
            const image = new Image();
            const newElement = {
                ...elData,
                image: image
            };
            image.src = elData.imageSrc;
            image.onload = () => {
                this.canvas.elements.push(newElement);
                elementsLoaded++;
                if (elementsLoaded === elementsToLoad) {
                    // Once all images are loaded, render the canvas
                    this.canvas.render();
                    window.app.updateUI();
                }
            };
            image.onerror = () => {
                // Handle broken image links if necessary
                elementsLoaded++;
                if (elementsLoaded === elementsToLoad) {
                    this.canvas.render();
                    window.app.updateUI();
                }
            }
        });
    }
}
