import { Universe, Cell } from "wasm-game-of-life";

// Import the WebAssembly memory
import { memory } from "wasm-game-of-life/wasm_game_of_life_bg";

const CELL_SIZE = 5; // px
const GRID_COLOR = "#CCCCCC";
const DEAD_COLOR = "#FFFFFF";
const ALIVE_COLOR = "#000000";

// Construct the universe, and get its width and height.
const universe = Universe.new(64, 64);
const width = universe.width();
const height = universe.height();

// Initialize it to some interesting state
universe.initialize();

// Give the canvas room for all of our cells and a 1px border
// around each of them.
const canvas = document.getElementById("game-of-life-canvas");
canvas.height = (CELL_SIZE + 1) * height + 1;
canvas.width = (CELL_SIZE + 1) * width + 1;

const ctx = canvas.getContext('2d');

const drawGrid = () => {
    ctx.beginPath();
    ctx.strokeStyle = GRID_COLOR;

    // Vertical lines.
    for (let i = 0; i <= width; i++) {
        ctx.moveTo(i * (CELL_SIZE + 1) + 1, 0);
        ctx.lineTo(i * (CELL_SIZE + 1) + 1, (CELL_SIZE + 1) * height + 1);
    }

    // Horizontal lines.
    for (let j = 0; j <= height; j++) {
        ctx.moveTo(0,                           j * (CELL_SIZE + 1) + 1);
        ctx.lineTo((CELL_SIZE + 1) * width + 1, j * (CELL_SIZE + 1) + 1);
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
                col * (CELL_SIZE + 1) + 1,
                row * (CELL_SIZE + 1) + 1,
                CELL_SIZE,
                CELL_SIZE
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
                col * (CELL_SIZE + 1) + 1,
                row * (CELL_SIZE + 1) + 1,
                CELL_SIZE,
                CELL_SIZE
            );
        }
    }

    ctx.stroke();
};

const drawCanvas = () => {
    drawGrid();
    drawCells();
};

function getEventPos(event) {
    const boundingRect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / boundingRect.width;
    const scaleY = canvas.height / boundingRect.height;

    const canvasLeft = (event.clientX - boundingRect.left) * scaleX;
    const canvasTop = (event.clientY - boundingRect.top) * scaleY;

    const row = Math.min(Math.floor(canvasTop / (CELL_SIZE + 1)), height - 1);
    const col = Math.min(Math.floor(canvasLeft / (CELL_SIZE + 1)), width - 1);

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

const play = () => {
    playPauseIcon.textContent = "pause";
    renderLoop();
};

const pause = () => {
    playPauseIcon.textContent = "play_arrow";
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

const playPauseButton = document.getElementById("button-play-pause");
playPauseButton.addEventListener("click", event => { playPause(); });

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
nextButton.addEventListener("click", event => { next(); });

const clear = () => {
    universe.clear();
    drawCanvas();
}

const clearButton = document.getElementById("button-clear");
clearButton.addEventListener("click", event => { clear(); });

play();
