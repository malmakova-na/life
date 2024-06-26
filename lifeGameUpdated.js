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

function hasCell(x, y) {
  return activeCells[index(x, y)] === 1;
}

function getNeighbors(x, y) {
  left_x = x - 1;
  if (left_x < 0) left_x += width;
  right_x = x + 1;
  if (right_x >= width) right_x -= width;
  up_y = y - 1;
  if (up_y < 0) up_y += height;
  down_y = y + 1;
  if (down_y >= height) down_y -= height;
  return [
    [left_x, up_y],
    [x, up_y],
    [right_x, up_y],
    [left_x, y],
    [right_x, y],
    [left_x, down_y],
    [x, down_y],
    [right_x, down_y],
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
    return sum + Number(hasCell(nx, ny));
  }, 0);
}
function toggleCellStateOnClick(event) {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((event.clientX - rect.left) / cellSize);
  const y = Math.floor((event.clientY - rect.top) / cellSize);

  setCell(x, y, !hasCell(x, y) ? 1 : 0);
  isChanged = true;
  renderField();
}
function setGridSettings(value) {
  document.getElementById("width").disabled = value;
  document.getElementById("height").disabled = value;
  document.getElementById("initializeField").disabled = value;
}
function isGridAvaliable() {
  if (isStarted) {
    setGridSettings(true);

    document.getElementById("simulationButton").style.display = "inline-block";
    document.getElementById("simulationButton").disabled = false;
  } else {
    setGridSettings(false);
    document.getElementById("simulationButton").disabled = false;
  }
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
  isGridAvaliable();

  setGridSettings(true);
  toggleSimulationButton();
  renderField();
}

function renderField() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      if (hasCell(x, y)) {
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
    let isSame = true;
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const aliveNeighbors = countAliveNeighbors(x, y);
        const currentIndex = index(x, y);
        newActiveCells[currentIndex] =
          (activeCells[currentIndex] === 1 &&
            (aliveNeighbors === 2 || aliveNeighbors === 3)) ||
          (activeCells[currentIndex] === 0 && aliveNeighbors === 3)
            ? 1
            : 0;
        if (isSame) {
          isSame = Boolean(newActiveCells[currentIndex]) === hasCell(x, y);
        }
      }
    }
    // console
    if (!isSame) {
      isChanged = true;
      // console.log(
      //   "activeCells",
      //   activeCells,
      //   " newActiveCells",
      //   newActiveCells
      // );
      activeCells = newActiveCells;
      renderField();
    } else {
      isChanged = false;
      // console.log
      alert("end of game");
    }
  }
}
const generationButton = document.getElementById("generationButton");

function toggleSimulationButton() {
  if (isStarted) {
    const simulationButton = document.getElementById("simulationButton");
    simulationButton.textContent = "Stop Game";
    simulationButton.addEventListener("click", stopGame);
    document.getElementById("simulationButton").classList.add("stop");
    simulationButton.removeEventListener("click", startGame);

    generationButton.disabled = true;
    document.getElementById("initializeField").disabled = true;
  } else {
    const simulationButton = document.getElementById("simulationButton");
    simulationButton.textContent = "Start Game";
    simulationButton.addEventListener("click", startGame);
    document.getElementById("simulationButton").classList.remove("stop");
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
  isGridAvaliable();
}
