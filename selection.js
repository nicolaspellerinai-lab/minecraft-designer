class Selection {
    constructor(canvasInstance) {
        this.canvas = canvasInstance;
        this.selected = new Set();
        this.isSelecting = false;
        this.selectionRect = { startX: 0, startY: 0, endX: 0, endY: 0 };
        
        Utils.listen(this.canvas.canvas, 'mousedown', e => this.handleMouseDown(e));
        Utils.listen(this.canvas.canvas, 'mousemove', e => this.handleMouseMove(e));
        Utils.listen(this.canvas.canvas, 'mouseup', e => this.handleMouseUp(e));
    }

    handleMouseDown(e) {
        if (e.button !== 0 || this.canvas.isPanning) return;
        
        const coords = this.canvas.getCanvasCoordinates(e);
        const clickedElement = this.getElementAt(coords);

        if (e.shiftKey) {
            if (clickedElement) {
                this.toggle(clickedElement);
            }
        } else {
            if (clickedElement) {
                if (!this.isSelected(clickedElement)) {
                    this.select(clickedElement);
                }
            } else {
                this.clear();
                this.isSelecting = true;
                this.selectionRect.startX = coords.x;
                this.selectionRect.startY = coords.y;
            }
        }
        this.canvas.render();
    }
    
    handleMouseMove(e) {
        if(this.isSelecting) {
            const coords = this.canvas.getCanvasCoordinates(e);
            this.selectionRect.endX = coords.x;
            this.selectionRect.endY = coords.y;
            this.canvas.render(); // Re-render to show selection rectangle
        }
    }
    
    handleMouseUp(e) {
        if (this.isSelecting) {
            this.isSelecting = false;
            this.selectInRect();
            this.canvas.render();
        }
    }

    select(element) {
        this.selected.clear();
        this.selected.add(element);
        this.updatePropertiesPanel();
    }

    toggle(element) {
        if (this.selected.has(element)) {
            this.selected.delete(element);
        } else {
            this.selected.add(element);
        }
        this.updatePropertiesPanel();
    }

    clear() {
        this.selected.clear();
        this.updatePropertiesPanel();
    }
    
    selectInRect() {
        const x1 = Math.min(this.selectionRect.startX, this.selectionRect.endX);
        const y1 = Math.min(this.selectionRect.startY, this.selectionRect.endY);
        const x2 = Math.max(this.selectionRect.startX, this.selectionRect.endX);
        const y2 = Math.max(this.selectionRect.startY, this.selectionRect.endY);

        this.canvas.elements.forEach(el => {
            const elCenterX = el.x + el.width / 2;
            const elCenterY = el.y + el.height / 2;
            if (elCenterX > x1 && elCenterX < x2 && elCenterY > y1 && elCenterY < y2) {
                this.selected.add(el);
            }
        });
        this.updatePropertiesPanel();
    }

    isSelected(element) {
        return this.selected.has(element);
    }
    
    getSelected() {
        return Array.from(this.selected);
    }

    getElementAt(coords) {
        // Iterate backwards to select top-most element
        for (let i = this.canvas.elements.length - 1; i >= 0; i--) {
            const el = this.canvas.elements[i];
            if (coords.x >= el.x && coords.x <= el.x + el.width &&
                coords.y >= el.y && coords.y <= el.y + el.height) {
                return el;
            }
        }
        return null;
    }
    
    updatePropertiesPanel() {
        const propertiesContent = Utils.qs('#properties-content');
        if (this.selected.size === 1) {
            const el = this.getSelected()[0];
            propertiesContent.innerHTML = `
                <label>Position X:</label>
                <input type="number" value="${el.x.toFixed(0)}" data-prop="x">
                <label>Position Y:</label>
                <input type="number" value="${el.y.toFixed(0)}" data-prop="y">
                <label>Largeur:</label>
                <input type="number" value="${el.width.toFixed(0)}" data-prop="width">
                <label>Hauteur:</label>
                <input type="number" value="${el.height.toFixed(0)}" data-prop="height">
            `;
            // Add event listeners for the new inputs...
        } else if (this.selected.size > 1) {
             propertiesContent.innerHTML = `<p>${this.selected.size} objets sélectionnés</p>`;
        } else {
            propertiesContent.innerHTML = '<p>Aucun objet sélectionné</p>';
        }
    }

    draw() {
        // Draw selection rectangle
        if (this.isSelecting) {
            this.canvas.ctx.fillStyle = 'rgba(0, 120, 212, 0.3)';
            this.canvas.ctx.strokeStyle = 'rgba(0, 120, 212, 0.8)';
            this.canvas.ctx.lineWidth = 1;
            const rect = {
                x: this.selectionRect.startX * this.canvas.transform.scale + this.canvas.transform.panX,
                y: this.selectionRect.startY * this.canvas.transform.scale + this.canvas.transform.panY,
                w: (this.selectionRect.endX - this.selectionRect.startX) * this.canvas.transform.scale,
                h: (this.selectionRect.endY - this.selectionRect.startY) * this.canvas.transform.scale
            };
            this.canvas.ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
            this.canvas.ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
        }
        
        // Draw outline around selected items
        this.canvas.ctx.save();
        this.canvas.ctx.translate(this.canvas.transform.panX, this.canvas.transform.panY);
        this.canvas.ctx.scale(this.canvas.transform.scale, this.canvas.transform.scale);
        
        this.canvas.ctx.strokeStyle = 'var(--accent-glow)';
        this.canvas.ctx.lineWidth = 2 / this.canvas.transform.scale;
        this.canvas.ctx.shadowColor = 'var(--accent-glow)';
        this.canvas.ctx.shadowBlur = 10 / this.canvas.transform.scale;

        this.getSelected().forEach(el => {
            this.canvas.ctx.strokeRect(el.x - 2, el.y - 2, el.width + 4, el.height + 4);
        });
        
        this.canvas.ctx.restore();
    }
}
