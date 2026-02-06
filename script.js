document.addEventListener('DOMContentLoaded', () => {
    const toolbar = document.getElementById('toolbar');
    const canvas = document.getElementById('canvas');
    const saveBtn = document.getElementById('save-btn');
    const minecraftItemsContainer = document.getElementById('minecraft-items');

    let draggedItem = null;
    let offsetX, offsetY;

    // --- Asset Loading ---
    // NOTE: These URLs are from a public wiki and might be unstable.
    // For a real application, host these assets yourself.
    const minecraftAssets = {
        'Diamond Sword': 'https://static.wikia.nocookie.net/minecraft_gamepedia/images/f/f3/Diamond_Sword_JE3_BE3.png',
        'Diamond Pickaxe': 'https://static.wikia.nocookie.net/minecraft_gamepedia/images/e/e7/Diamond_Pickaxe_JE3_BE3.png',
        'Crafting Table': 'https://static.wikia.nocookie.net/minecraft_gamepedia/images/c/c9/Crafting_Table_JE4_BE3.png',
        'Furnace': 'https://static.wikia.nocookie.net/minecraft_gamepedia/images/d/d3/Furnace_JE4_BE1.png',
        'Dirt Block': 'https://static.wikia.nocookie.net/minecraft_gamepedia/images/1/18/Dirt_JE5_BE3.png'
    };

    Object.entries(minecraftAssets).forEach(([name, url]) => {
        const img = document.createElement('img');
        img.src = url;
        img.alt = name;
        img.classList.add('draggable');
        img.setAttribute('draggable', 'true');
        img.setAttribute('data-type', 'minecraft');
        minecraftItemsContainer.appendChild(img);
    });


    // --- Drag and Drop from Toolbar ---

    toolbar.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('draggable')) {
            draggedItem = e.target;
            // For image types, we pass the src, for others, the type.
            let data;
            if(e.target.dataset.type === 'minecraft') {
                data = JSON.stringify({ type: 'minecraft', src: e.target.src });
            } else {
                data = JSON.stringify({ type: e.target.dataset.type });
            }
            e.dataTransfer.setData('application/json', data);
        }
    });

    canvas.addEventListener('dragover', (e) => {
        e.preventDefault(); // Allow drop
    });

    canvas.addEventListener('drop', (e) => {
        e.preventDefault();
        const data = JSON.parse(e.dataTransfer.getData('application/json'));
        const canvasRect = canvas.getBoundingClientRect();

        const x = e.clientX - canvasRect.left;
        const y = e.clientY - canvasRect.top;

        createElementOnCanvas(data, x, y);
    });

    function createElementOnCanvas(data, x, y) {
        let newItem;
        if (data.type === 'text') {
            newItem = document.createElement('div');
            newItem.textContent = 'Double-click to edit';
            newItem.style.padding = '10px';
            newItem.style.border = '1px dashed #333';
            newItem.addEventListener('dblclick', makeEditable);
        } else if (data.type === 'image') {
            newItem = document.createElement('img');
            const url = prompt("Enter image URL:", "https://via.placeholder.com/150");
            newItem.src = url || "https://via.placeholder.com/150";
            newItem.style.width = '150px';
            newItem.addEventListener('dblclick', changeImage);
        } else if (data.type === 'minecraft') {
            newItem = document.createElement('img');
            newItem.src = data.src;
            newItem.style.width = '64px';
        }

        if (newItem) {
            newItem.classList.add('canvas-item');
            newItem.style.left = `${x}px`;
            newItem.style.top = `${y}px`;
            makeMovable(newItem);
            canvas.appendChild(newItem);
        }
    }


    // --- Make Canvas Items Movable ---

    function makeMovable(element) {
        element.addEventListener('mousedown', (e) => {
            draggedItem = element;
            offsetX = e.clientX - element.getBoundingClientRect().left;
            offsetY = e.clientY - element.getBoundingClientRect().top;

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }

    function onMouseMove(e) {
        if (!draggedItem) return;
        const canvasRect = canvas.getBoundingClientRect();
        let x = e.clientX - canvasRect.left - offsetX;
        let y = e.clientY - canvasRect.top - offsetY;
        
        // Constrain to canvas boundaries
        x = Math.max(0, Math.min(x, canvasRect.width - draggedItem.offsetWidth));
        y = Math.max(0, Math.min(y, canvasRect.height - draggedItem.offsetHeight));

        draggedItem.style.left = `${x}px`;
        draggedItem.style.top = `${y}px`;
    }

    function onMouseUp() {
        draggedItem = null;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }


    // --- In-place Editing ---
    function makeEditable(e) {
        const div = e.target;
        const text = div.textContent;
        const input = document.createElement('textarea');
        input.value = text;
        input.style.width = div.clientWidth + 'px';
        input.style.height = div.clientHeight + 'px';
        input.style.font = 'inherit';

        div.textContent = '';
        div.appendChild(input);
        input.focus();

        input.addEventListener('blur', () => {
            div.textContent = input.value;
        });
    }

    function changeImage(e) {
        const img = e.target;
        const url = prompt("Enter new image URL:", img.src);
        if (url) {
            img.src = url;
        }
    }

    // --- Save to PNG ---

    saveBtn.addEventListener('click', () => {
        // Temporarily remove borders from canvas items for a clean image
        const items = document.querySelectorAll('.canvas-item');
        items.forEach(item => item.style.border = 'none');

        html2canvas(canvas, {
            backgroundColor: null, // Use canvas background
            logging: true,
            useCORS: true // Important for external images
        }).then(canvasElement => {
            // Restore borders
            items.forEach(item => item.style.border = '1px solid #999');

            const link = document.createElement('a');
            link.download = 'minecraft-design.png';
            link.href = canvasElement.toDataURL('image/png');
            link.click();
        }).catch(err => {
            console.error("Oops, something went wrong!", err);
            // Restore borders even if there's an error
            items.forEach(item => item.style.border = '1px solid #999');
        });
    });
});
