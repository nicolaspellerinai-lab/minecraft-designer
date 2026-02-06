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
        if (e.target.classList.contains('asset-item')) {
            this.draggedAssetId = e.target.dataset.assetId;
            // You can also set a custom drag image here if you want
        }
    }

    handleCanvasDrop(e) {
        e.preventDefault();
        if (this.draggedAssetId) {
            const coords = this.canvas.getCanvasCoordinates(e);
            
            // In a real app, you'd get asset properties from a config
            const newElement = {
                id: Utils.uuid(),
                assetId: this.draggedAssetId,
                x: coords.x - 32 / 2, // Center the item on the cursor
                y: coords.y - 32 / 2,
                width: 32,
                height: 32,
                image: new Image(),
                zIndex: this.canvas.elements.length
            };
            newElement.image.src = `https://via.placeholder.com/32/FF0000?text=${this.draggedAssetId}`; // Placeholder
            
            newElement.image.onload = () => {
                const command = new AddElementCommand(this.canvas, newElement);
                this.app.history.add(command);
                this.draggedAssetId = null;
            }
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
