class DragDrop {
    constructor(canvasInstance, appInstance) {
        this.canvas = canvasInstance;
        this.app = appInstance;
        this.draggedAssetId = null;
        this.draggedElement = null;
        this.isDraggingOnCanvas = false;
        this.dragOffset = { x: 0, y: 0 };

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for drag start on the asset grid
        Utils.listen(Utils.qs('#asset-grid'), 'dragstart', e => this.handleAssetDragStart(e));

        // Listen for drop events on the canvas
        Utils.listen(this.canvas.canvas, 'dragover', e => e.preventDefault());
        Utils.listen(this.canvas.canvas, 'drop', e => this.handleCanvasDrop(e));
        
        // Listen for mouse down on canvas elements to initiate drag
        Utils.listen(this.canvas.canvas, 'mousedown', e => this.handleCanvasMouseDown(e));
        Utils.listen(this.canvas.canvas, 'mousemove', e => this.handleCanvasMouseMove(e));
        Utils.listen(this.canvas.canvas, 'mouseup', e => this.handleCanvasMouseUp(e));
    }

    handleAssetDragStart(e) {
        const item = e.target.closest('.asset-item');
        if (item) {
            this.draggedAssetId = item.dataset.assetId;
            this.draggedAssetPath = item.dataset.assetPath;
            this.draggedAssetName = item.dataset.assetName;
            e.dataTransfer.setData('text/plain', this.draggedAssetId);
            e.dataTransfer.effectAllowed = 'move';
        }
    }

    handleCanvasDrop(e) {
        e.preventDefault();
        if (this.draggedAssetId && this.draggedAssetPath) {
            const coords = this.canvas.getCanvasCoordinates(e);
            
            const newElement = {
                id: Utils.uuid(),
                assetId: this.draggedAssetId,
                assetName: this.draggedAssetName,
                x: coords.x - 48 / 2,
                y: coords.y - 48 / 2,
                width: 48,
                height: 48,
                image: new Image(),
                zIndex: this.canvas.elements.length
            };
            
            newElement.image.src = this.draggedAssetPath;
            
            newElement.image.onload = () => {
                const command = new AddElementCommand(this.canvas, newElement);
                this.app.history.add(command);
                this.canvas.render();
            };
            
            newElement.image.onerror = () => {
                console.error('Failed to load image:', this.draggedAssetPath);
                // Use fallback
                newElement.image.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32"%3E%3Crect fill="%23ff00ff" stroke="%23000" width="32" height="32"/%3E%3Ctext x="16" y="20" text-anchor="middle" font-size="8"%3E?%3C/text%3E%3C/svg%3E';
            };
            
            this.draggedAssetId = null;
            this.draggedAssetPath = null;
            this.draggedAssetName = null;
        }
    }
    
    handleCanvasMouseDown(e) {
        // Don't drag if panning
        if (e.button !== 0 || this.canvas.isPanning) return;
        
        const coords = this.canvas.getCanvasCoordinates(e);
        const clickedElement = this.app.selection.getElementAt(coords);

        if (clickedElement) {
            this.isDraggingOnCanvas = true;
            this.draggedElement = clickedElement;
            this.dragOffset.x = coords.x - clickedElement.x;
            this.dragOffset.y = coords.y - clickedElement.y;
            
            // Also select the element if it's not already
            if (!this.app.selection.isSelected(clickedElement)) {
                this.app.selection.select(clickedElement);
            }
        }
    }
    
    handleCanvasMouseMove(e) {
        if (this.isDraggingOnCanvas && this.draggedElement) {
            const coords = this.canvas.getCanvasCoordinates(e);
            const newX = coords.x - this.dragOffset.x;
            const newY = coords.y - this.dragOffset.y;
            
            // Update position for all selected elements
            const selected = this.app.selection.getSelected();
            const dx = newX - this.draggedElement.x;
            const dy = newY - this.draggedElement.y;
            
            selected.forEach(el => {
                el.x += dx;
                el.y += dy;
            });

            this.canvas.render();
        }
    }

    handleCanvasMouseUp(e) {
        if (this.isDraggingOnCanvas && this.draggedElement) {
            // Create a command for the move action for undo/redo
            // For simplicity, we'll implement this later.
            // For now, the move is permanent.
        }
        this.isDraggingOnCanvas = false;
        this.draggedElement = null;
    }
}
