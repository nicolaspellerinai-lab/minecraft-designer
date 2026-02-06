class Transform {
    constructor(canvasInstance, selectionInstance) {
        this.canvas = canvasInstance;
        this.selection = selectionInstance;
        this.transformHandleSize = 8; // in px
        
        // We will add more properties for scaling and rotating later
    }

    move(element, dx, dy) {
        element.x += dx;
        element.y += dy;
    }
    
    // This method will be called to draw the transformation handles
    drawHandles() {
        const selected = this.selection.getSelected();
        if (selected.length === 0) return;

        this.canvas.ctx.save();
        this.canvas.ctx.translate(this.canvas.transform.panX, this.canvas.transform.panY);
        this.canvas.ctx.scale(this.canvas.transform.scale, this.canvas.transform.scale);
        
        const handleSize = this.transformHandleSize / this.canvas.transform.scale;

        selected.forEach(el => {
            const x = el.x;
            const y = el.y;
            const width = el.width;
            const height = el.height;

            this.canvas.ctx.fillStyle = '#FFF';
            this.canvas.ctx.strokeStyle = 'var(--accent-blue)';
            this.canvas.ctx.lineWidth = 1 / this.canvas.transform.scale;
            
            // Draw 8 handles: 4 corners, 4 sides
            this.drawHandle(x - handleSize/2, y - handleSize/2); // Top-left
            this.drawHandle(x + width/2 - handleSize/2, y - handleSize/2); // Top-middle
            this.drawHandle(x + width - handleSize/2, y - handleSize/2); // Top-right
            this.drawHandle(x - handleSize/2, y + height/2 - handleSize/2); // Middle-left
            this.drawHandle(x + width - handleSize/2, y + height/2 - handleSize/2); // Middle-right
            this.drawHandle(x - handleSize/2, y + height - handleSize/2); // Bottom-left
            this.drawHandle(x + width/2 - handleSize/2, y + height - handleSize/2); // Bottom-middle
            this.drawHandle(x + width - handleSize/2, y + height - handleSize/2); // Bottom-right
            
            // Rotation handle (placeholder)
            this.drawHandle(x + width/2 - handleSize/2, y - height/2 - handleSize/2);
        });

        this.canvas.ctx.restore();
    }
    
    drawHandle(x, y) {
        const handleSize = this.transformHandleSize / this.canvas.transform.scale;
        this.canvas.ctx.fillRect(x, y, handleSize, handleSize);
        this.canvas.ctx.strokeRect(x, y, handleSize, handleSize);
    }
    
    // Placeholder for future transform functions
    scale() {}
    rotate() {}
    flip() {}
    align() {}
    distribute() {}
}
