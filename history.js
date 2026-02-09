class History {
    constructor(appInstance) {
        this.app = appInstance;
        this.undoStack = [];
        this.redoStack = [];
        this.MAX_HISTORY = 50;
    }

    add(command, shouldExecute = true) {
        this.undoStack.push(command);
        this.redoStack = []; // Clear redo stack on new action
        if (this.undoStack.length > this.MAX_HISTORY) {
            this.undoStack.shift(); // Remove the oldest command
        }
        if (shouldExecute) {
            command.execute();
        }
        this.app.updateUI();
    }

    undo() {
        if (this.undoStack.length > 0) {
            const command = this.undoStack.pop();
            command.undo();
            this.redoStack.push(command);
            this.app.updateUI();
        }
    }

    redo() {
        if (this.redoStack.length > 0) {
            const command = this.redoStack.pop();
            command.execute();
            this.undoStack.push(command);
            this.app.updateUI();
        }
    }
    
    clear() {
        this.undoStack = [];
        this.redoStack = [];
    }
}

// --- Command Classes ---

class Command {
    constructor() {
        if (this.constructor === Command) {
            throw new Error("Abstract class 'Command' cannot be instantiated directly.");
        }
    }
    execute() { throw new Error("Method 'execute()' must be implemented."); }
    undo() { throw new Error("Method 'undo()' must be implemented."); }
}

class AddElementCommand extends Command {
    constructor(canvas, element) {
        super();
        this.canvas = canvas;
        this.element = element;
    }

    execute() {
        this.canvas.addElement(this.element);
    }

    undo() {
        this.canvas.removeElement(this.element);
    }
}

class RemoveElementCommand extends Command {
    constructor(canvas, elements) {
        super();
        this.canvas = canvas;
        // always store as an array, even if it's a single element
        this.elements = Array.isArray(elements) ? elements : [elements];
    }
    
    execute() {
        this.elements.forEach(el => this.canvas.removeElement(el));
    }
    
    undo() {
        this.elements.forEach(el => this.canvas.addElement(el));
    }
}

class MoveElementCommand extends Command {
    constructor(elements, dx, dy) {
        super();
        this.elements = Array.isArray(elements) ? elements : [elements];
        this.dx = dx;
        this.dy = dy;
    }
    
    execute() {
        this.elements.forEach(el => {
            el.x += this.dx;
            el.y += this.dy;
        });
    }
    
    undo() {
         this.elements.forEach(el => {
            el.x -= this.dx;
            el.y -= this.dy;
        });
    }
}
// We can add more commands like TransformElementCommand, ChangeZIndexCommand, etc. later
