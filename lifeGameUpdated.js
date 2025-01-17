const cellSize = 10;

let activeCells;
let width, height;
let animationId;
let canvas, ctx;
let isChanged = true;
let isActiveRandomMode = false;
let isStarted = false;

function index(x, y) {
  return x + y * width;
}
function initializeCells() {
  activeCells = new Uint8Array(new ArrayBuffer(width * height));
}

function setCell(x, y, value) {
  activeCells[index(x, y)] = value ? 1 : 0;
}

function getCell(x, y) {
  return activeCells[index(x, y)];
}

function getNeighbors(x, y) {
  let leftX = x - 1;
  if (leftX < 0) leftX += width;
  let rightX = x + 1;
  if (rightX >= width) rightX -= width;
  let upY = y - 1;
  if (upY < 0) upY += height;
  let downY = y + 1;
  if (downY >= height) downY -= height;
  return [
    [leftX, upY],
    [x, upY],
    [rightX, upY],
    [leftX, y],
    [rightX, y],
    [leftX, downY],
    [x, downY],
    [rightX, downY],
  ];
}

function setRandomFirstGeneration() {
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      setCell(x, y, Math.random() < 0.6);
    }
  }
}

function countAliveNeighbors(x, y) {
  return getNeighbors(x, y).reduce((sum, [nx, ny]) => {
    return sum + getCell(nx, ny);
  }, 0);
}
function toggleCellStateOnClick(event) {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((event.clientX - rect.left) / cellSize);
  const y = Math.floor((event.clientY - rect.top) / cellSize);

  setCell(x, y, !getCell(x, y) ? 1 : 0);
  isChanged = true;
  renderField();
}

function setGridAccess(value) {
  document.getElementById("width").disabled = value;
  document.getElementById("height").disabled = value;
  document.getElementById("initializeField").disabled = value;
}
function updateControlState() {
  const simulationButton = document.getElementById("simulationButton");
  simulationButton.disabled = false;
  setGridAccess(isStarted);
}
function initializeField() {
  width = parseInt(document.getElementById("width").value);
  height = parseInt(document.getElementById("height").value);
  initializeCells();

  canvas = document.getElementById("gameCanvas");
  ctx = canvas.getContext("2d");

  canvas.width = width * cellSize;
  canvas.height = height * cellSize;

  canvas.addEventListener("click", toggleCellStateOnClick);

  updateControlState();
  toggleSimulationButton();
  renderField();
}

function renderField() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      if (getCell(x, y)) {
        ctx.fillStyle = "black";
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  }
  drawGrid();
}

function drawGrid() {
  ctx.strokeStyle = "#ccc";
  for (let x = 0; x <= width; x++) {
    ctx.beginPath();
    ctx.moveTo(x * cellSize, 0);
    ctx.lineTo(x * cellSize, height * cellSize);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * cellSize);
    ctx.lineTo(width * cellSize, y * cellSize);
    ctx.stroke();
  }
}
function updateField() {
  if (isStarted) {
    const newActiveCells = new Uint8Array(new ArrayBuffer(width * height));
    let isSameGrid = true;
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const aliveNeighbors = countAliveNeighbors(x, y);
        const currentIndex = index(x, y);
        const currentCellState =
          (activeCells[currentIndex] === 1 &&
            (aliveNeighbors === 2 || aliveNeighbors === 3)) ||
          (activeCells[currentIndex] === 0 && aliveNeighbors === 3)
            ? 1
            : 0;
        newActiveCells[currentIndex] = currentCellState;
        if (isSameGrid) {
          isSameGrid = newActiveCells[currentIndex] === getCell(x, y);
        }
      }
    }
    isChanged = !isSameGrid;
    if (isChanged) {
      activeCells = newActiveCells;
      renderField();
    }
  }
}
const generationButton = document.getElementById("generationButton");

function toggleSimulationButton() {
  const simulationButton = document.getElementById("simulationButton");
  if (isStarted) {
    simulationButton.textContent = "Stop Game";
    simulationButton.addEventListener("click", stopGame);
    simulationButton.classList.add("stop");
    simulationButton.removeEventListener("click", startGame);

    generationButton.disabled = true;
    setGridAccess(isStarted);
  } else {
    simulationButton.textContent = "Start Game";
    simulationButton.addEventListener("click", startGame);
    simulationButton.classList.remove("stop");
    simulationButton.removeEventListener("click", stopGame);
    generationButton.disabled = false;
  }
}

generationButton.addEventListener("change", function () {
  isActiveRandomMode = this.checked;
  if (isActiveRandomMode) {
    setRandomFirstGeneration();
  } else {
    initializeCells();
    updateField();
  }
});

function startGame() {
  isStarted = true;
  toggleSimulationButton();

  function gameLoop() {
    const isEmptyGrid = !activeCells.length;

    if ((!isEmptyGrid && !isChanged) || isEmptyGrid) {
      if (isActiveRandomMode) {
        setRandomFirstGeneration();
      } else {
        cancelAnimationFrame(animationId);
        isStarted = false;
        isChanged = false;
        toggleSimulationButton();
        return;
      }
    }
    updateField();
    animationId = requestAnimationFrame(gameLoop);
  }
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  gameLoop();
}

function stopGame() {
  isStarted = false;

  toggleSimulationButton();
  cancelAnimationFrame(animationId);
}

function clearGame() {
  isChanged = true;
  isStarted = false;

  document.getElementById("generationButton").checked = false;
  isActiveRandomMode = false;

  initializeField();
  toggleSimulationButton();
  updateControlState();
}
