class Canvas {
    constructor(canvasId) {
        this.canvas = Utils.qs(`#${canvasId}`);
        this.ctx = this.canvas.getContext('2d');
        this.elements = []; // All elements on the canvas
        this.transform = {
            scale: 1,
            panX: 0,
            panY: 0
        };
        this.isPanning = false;
        this.lastPanPosition = { x: 0, y: 0 };
        this.isGridVisible = true;
        this.gridSize = 32;

        this.resize();
        this.setupCanvasEventListeners();
    }

    resize() {
        this.canvas.width = this.canvas.parentElement.offsetWidth;
        this.canvas.height = this.canvas.parentElement.offsetHeight;
        this.render();
    }

    setupCanvasEventListeners() {
        Utils.listen(this.canvas, 'mousedown', e => this.handleMouseDown(e));
        Utils.listen(this.canvas, 'mousemove', e => this.handleMouseMove(e));
        Utils.listen(this.canvas, 'mouseup', e => this.handleMouseUp(e));
        Utils.listen(this.canvas, 'mouseleave', e => this.handleMouseUp(e)); // Stop panning if mouse leaves canvas
        Utils.listen(this.canvas, 'wheel', e => this.handleWheel(e));
    }
    
    handleMouseDown(e) {
        // Panning with middle mouse or space + drag
        if (e.button === 1 || (e.button === 0 && e.spaceKey)) {
            this.isPanning = true;
            this.lastPanPosition = { x: e.clientX, y: e.clientY };
            this.canvas.style.cursor = 'grabbing';
        }
    }
    
    handleMouseMove(e) {
        if (this.isPanning) {
            const dx = e.clientX - this.lastPanPosition.x;
            const dy = e.clientY - this.lastPanPosition.y;
            this.transform.panX += dx;
            this.transform.panY += dy;
            this.lastPanPosition = { x: e.clientX, y: e.clientY };
            this.render();
        }
        
        // Update coordinates in status bar
        const coords = this.getCanvasCoordinates(e);
        Utils.qs('#coords').textContent = `X: ${Math.round(coords.x)}, Y: ${Math.round(coords.y)}`;
    }
    
    handleMouseUp(e) {
        this.isPanning = false;
        this.canvas.style.cursor = 'default';
    }
    
    handleWheel(e) {
        e.preventDefault();
        const zoomIntensity = 0.1;
        const scaleAmount = e.deltaY > 0 ? 1 - zoomIntensity : 1 + zoomIntensity;
        
        const mouse = this.getCanvasCoordinates(e);

        this.transform.panX -= mouse.x * (scaleAmount - 1) * this.transform.scale;
        this.transform.panY -= mouse.y * (scaleAmount - 1) * this.transform.scale;
        this.transform.scale *= scaleAmount;
        
        // Clamp zoom
        this.transform.scale = Utils.clamp(this.transform.scale, 0.1, 10);

        this.render();
        window.app.updateUI(); // A bit of a hack, better to use an event emitter
    }
    
    getCanvasCoordinates(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - this.transform.panX) / this.transform.scale;
        const y = (e.clientY - rect.top - this.transform.panY) / this.transform.scale;
        return { x, y };
    }
    
    addElement(element) {
        this.elements.push(element);
        this.render();
        window.app.updateUI();
    }
    
    removeElement(element) {
        this.elements = this.elements.filter(el => el.id !== element.id);
        this.render();
        window.app.updateUI();
    }
    
    clear() {
        this.elements = [];
        this.render();
    }

    toggleGrid() {
        this.isGridVisible = !this.isGridVisible;
        this.render();
    }

    drawGrid() {
        if (!this.isGridVisible) return;

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        const scaledGridSize = this.gridSize * this.transform.scale;
        const startX = this.transform.panX % scaledGridSize;
        const startY = this.transform.panY % scaledGridSize;

        for (let x = startX; x < this.canvas.width; x += scaledGridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        for (let y = startY; y < this.canvas.height; y += scaledGridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    render() {
        requestAnimationFrame(() => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.drawGrid();
            
            this.ctx.save();
            this.ctx.translate(this.transform.panX, this.transform.panY);
            this.ctx.scale(this.transform.scale, this.transform.scale);
            
            // Sort elements by z-index before drawing
            this.elements.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

            this.elements.forEach(el => {
                if(el.image) {
                    this.ctx.drawImage(el.image, el.x, el.y, el.width, el.height);
                }
            });
            
            this.ctx.restore();

            // Draw selection outlines, handles etc. on top
             if(window.app && window.app.selection) {
                window.app.selection.draw();
            }
        });
    }
}
