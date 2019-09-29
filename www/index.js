import { Universe, Cell } from "wasm-game-of-life";

// Import the WebAssembly memory
import { memory } from "wasm-game-of-life/wasm_game_of_life_bg";

const BORDER_WIDTH = 1; // px
const MIN_CELL_SIZE = 5; // px
const GRID_COLOR = "#CCCCCC";
const DEAD_COLOR = "#FFFFFF";
const ALIVE_COLOR = "#000000";

let cellSize = 0;

const canvas = document.getElementById("game-of-life-canvas");
const navBar = document.getElementById("nav-bar");

// Construct the universe, and get its width and height.
const universe = Universe.new(64, 64);
const width = universe.width();
const height = universe.height();

// Initialize it to some interesting state
universe.initialize();

const ctx = canvas.getContext('2d');

const drawGrid = () => {
    ctx.beginPath();
    ctx.strokeStyle = GRID_COLOR;

    // Vertical lines.
    for (let i = 0; i <= width; i++) {
        ctx.moveTo(i * (cellSize + BORDER_WIDTH) + BORDER_WIDTH, 0);
        ctx.lineTo(i * (cellSize + BORDER_WIDTH) + BORDER_WIDTH, (cellSize + BORDER_WIDTH) * height + BORDER_WIDTH);
    }

    // Horizontal lines.
    for (let j = 0; j <= height; j++) {
        ctx.moveTo(0, j * (cellSize + BORDER_WIDTH) + BORDER_WIDTH);
        ctx.lineTo((cellSize + BORDER_WIDTH) * width + BORDER_WIDTH, j * (cellSize + BORDER_WIDTH) + BORDER_WIDTH);
    }

    ctx.stroke();
};

const getIndex = (row, column) => {
    return row * width + column;
};

const drawCells = () => {
    const cellsPtr = universe.cells();
    const cells = new Uint8Array(memory.buffer, cellsPtr, width * height);

    ctx.beginPath();

    // Alive cells.
    ctx.fillStyle = ALIVE_COLOR;
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const idx = getIndex(row, col);
            if (cells[idx] !== Cell.Alive) {
                continue;
            }

            ctx.fillRect(
                col * (cellSize + BORDER_WIDTH) + BORDER_WIDTH,
                row * (cellSize + BORDER_WIDTH) + BORDER_WIDTH,
                cellSize,
                cellSize
            );
        }
    }

    // Dead cells.
    ctx.fillStyle = DEAD_COLOR;
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const idx = getIndex(row, col);
            if (cells[idx] !== Cell.Dead) {
                continue;
            }

            ctx.fillRect(
                col * (cellSize + BORDER_WIDTH) + BORDER_WIDTH,
                row * (cellSize + BORDER_WIDTH) + BORDER_WIDTH,
                cellSize,
                cellSize
            );
        }
    }

    ctx.stroke();
};



const drawCanvas = () => {
    resizeCellsIfNeeded();
    drawGrid();
    drawCells();
};

function getEventPos(event) {
    const boundingRect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / boundingRect.width;
    const scaleY = canvas.height / boundingRect.height;

    const canvasLeft = (event.clientX - boundingRect.left) * scaleX;
    const canvasTop = (event.clientY - boundingRect.top) * scaleY;

    const row = Math.min(Math.floor(canvasTop / (cellSize + BORDER_WIDTH)), height - BORDER_WIDTH);
    const col = Math.min(Math.floor(canvasLeft / (cellSize + BORDER_WIDTH)), width - BORDER_WIDTH);

    return { row: row, col: col };
};

canvas.addEventListener("click", event => {
    const pos = getEventPos(event);
    universe.toggle_cell(pos.row, pos.col);
    requestAnimationFrame(drawCanvas);
});

canvas.addEventListener("mousemove", event => {
    if (event.buttons === 1) {
        const pos = getEventPos(event);
        if (universe.set_cell_alive(pos.row, pos.col)) {
            requestAnimationFrame(drawCanvas);
        }
    }
});

let animationId = null;

const isPaused = () => {
    return animationId === null;
};

const renderLoop = () => {
    universe.tick();
    drawCanvas();
    animationId = requestAnimationFrame(renderLoop);
};

const playPauseIcon = document.getElementById("icon-play-pause");
const playPauseButton = document.getElementById("button-play-pause");

const play = () => {
    playPauseButton.alt = "Pause";
    playPauseIcon.className = "fa fa-pause";
    renderLoop();
};

const pause = () => {
    playPauseButton.alt = "Play";
    playPauseIcon.className = "fa fa-play";
    cancelAnimationFrame(animationId);
    animationId = null;
};

const playPause = () => {
    if (isPaused()) {
        play();
    } else {
        pause();
    }
}

playPauseButton.addEventListener("click", event => { event.preventDefault(); playPause(); });

const resizeCellsIfNeeded = () => {
    let parentWidth = window.innerWidth;
    let parentHeight = window.innerHeight - navBar.clientHeight;
    let newCellWidth = Math.floor((parentWidth - (width * BORDER_WIDTH + BORDER_WIDTH)) / width);
    let newCellHeight = Math.floor((parentHeight - (height * BORDER_WIDTH + BORDER_WIDTH)) / height);
    let newCellSize = Math.max(Math.min(newCellWidth, newCellHeight), MIN_CELL_SIZE);
    if (cellSize !== newCellSize) {
        cellSize = newCellSize;
        canvas.width = width * (cellSize + BORDER_WIDTH) + BORDER_WIDTH;
        canvas.height = height * (cellSize + BORDER_WIDTH) + BORDER_WIDTH;
    };
}

window.addEventListener("resize", event => {
    if (isPaused()) {
        requestAnimationFrame(drawCanvas);
    }
});

window.addEventListener("keydown", event => {
    switch (event.code) {
    case 'Space':
        playPause();
        break;
    case 'KeyN':
    case 'ArrowRight':
        event.repeat || next();
        break;
    }
});

const next = () => {
    universe.tick();
    drawCanvas();
}

const nextButton = document.getElementById("button-next");
nextButton.addEventListener("click", event => { event.preventDefault(); next(); });

const clear = () => {
    universe.clear();
    drawCanvas();
}

const clearButton = document.getElementById("button-clear");
clearButton.addEventListener("click", event => { event.preventDefault(); clear(); });

play();
