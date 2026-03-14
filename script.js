const winningCombinations = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
];

const cells = Array.from(document.querySelectorAll(".cell"));
const modeButtons = Array.from(document.querySelectorAll(".mode-button"));
const statusMessageElement = document.getElementById("status-message");
const turnIndicatorElement = document.getElementById("turn-indicator");
const modeLabelElement = document.getElementById("mode-label");
const restartButton = document.getElementById("restart-button");

const gameState = {
  board: Array(9).fill(""),
  currentPlayer: "X",
  isGameActive: true,
  mode: "ai",
  winner: null,
  winningCombination: [],
  isComputerThinking: false,
  pendingComputerMove: null
};

function initializeGame() {
  cells.forEach((cell) => {
    cell.addEventListener("click", handleCellClick);
  });

  modeButtons.forEach((button) => {
    button.addEventListener("click", handleModeChange);
  });

  restartButton.addEventListener("click", resetGame);

  updateInterface();
}

function handleCellClick(event) {
  const cellIndex = Number(event.currentTarget.dataset.index);

  if (!gameState.isGameActive || gameState.isComputerThinking || gameState.board[cellIndex]) {
    return;
  }

  applyMove(cellIndex, gameState.currentPlayer);

  if (finishRoundIfNeeded()) {
    return;
  }

  switchPlayer();

  if (shouldComputerPlay()) {
    triggerComputerMove();
    return;
  }

  updateInterface();
}

function handleModeChange(event) {
  const selectedMode = event.currentTarget.dataset.mode;

  if (selectedMode === gameState.mode) {
    return;
  }

  gameState.mode = selectedMode;
  resetGame();
}

function resetGame() {
  clearPendingComputerMove();
  gameState.board = Array(9).fill("");
  gameState.currentPlayer = "X";
  gameState.isGameActive = true;
  gameState.winner = null;
  gameState.winningCombination = [];
  gameState.isComputerThinking = false;
  updateInterface();
}

function applyMove(index, player) {
  gameState.board[index] = player;
}

function switchPlayer() {
  gameState.currentPlayer = gameState.currentPlayer === "X" ? "O" : "X";
}

function shouldComputerPlay() {
  return gameState.mode === "ai" && gameState.currentPlayer === "O" && gameState.isGameActive;
}

function triggerComputerMove() {
  clearPendingComputerMove();
  gameState.isComputerThinking = true;
  updateInterface();

  gameState.pendingComputerMove = window.setTimeout(() => {
    gameState.pendingComputerMove = null;
    const bestMove = getBestMove(gameState.board);

    if (bestMove === null) {
      gameState.isComputerThinking = false;
      updateInterface();
      return;
    }

    applyMove(bestMove, "O");
    gameState.isComputerThinking = false;

    if (finishRoundIfNeeded()) {
      return;
    }

    switchPlayer();
    updateInterface();
  }, 350);
}

function clearPendingComputerMove() {
  if (gameState.pendingComputerMove !== null) {
    window.clearTimeout(gameState.pendingComputerMove);
    gameState.pendingComputerMove = null;
  }
}

function finishRoundIfNeeded() {
  const roundResult = evaluateBoard(gameState.board);

  if (!roundResult.winner && !roundResult.isDraw) {
    return false;
  }

  gameState.isGameActive = false;
  gameState.winner = roundResult.winner;
  gameState.winningCombination = roundResult.combination;
  gameState.pendingComputerMove = null;
  updateInterface();
  return true;
}

function evaluateBoard(board) {
  for (const combination of winningCombinations) {
    const [first, second, third] = combination;

    if (
      board[first] &&
      board[first] === board[second] &&
      board[first] === board[third]
    ) {
      return {
        winner: board[first],
        combination,
        isDraw: false
      };
    }
  }

  const isDraw = board.every((cell) => cell !== "");

  return {
    winner: null,
    combination: [],
    isDraw
  };
}

function getBestMove(board) {
  let bestScore = -Infinity;
  let bestMove = null;

  getAvailableMoves(board).forEach((moveIndex) => {
    board[moveIndex] = "O";
    const score = minimax(board, 0, false);
    board[moveIndex] = "";

    if (score > bestScore) {
      bestScore = score;
      bestMove = moveIndex;
    }
  });

  return bestMove;
}

function minimax(board, depth, isMaximizingPlayer) {
  const result = evaluateBoard(board);

  if (result.winner === "O") {
    return 10 - depth;
  }

  if (result.winner === "X") {
    return depth - 10;
  }

  if (result.isDraw) {
    return 0;
  }

  // O maximiza a pontuacao da IA, enquanto X tenta minimiza-la.
  if (isMaximizingPlayer) {
    let bestScore = -Infinity;

    getAvailableMoves(board).forEach((moveIndex) => {
      board[moveIndex] = "O";
      const score = minimax(board, depth + 1, false);
      board[moveIndex] = "";
      bestScore = Math.max(bestScore, score);
    });

    return bestScore;
  }

  let bestScore = Infinity;

  getAvailableMoves(board).forEach((moveIndex) => {
    board[moveIndex] = "X";
    const score = minimax(board, depth + 1, true);
    board[moveIndex] = "";
    bestScore = Math.min(bestScore, score);
  });

  return bestScore;
}

function getAvailableMoves(board) {
  return board
    .map((value, index) => (value === "" ? index : null))
    .filter((value) => value !== null);
}

function updateInterface() {
  updateModeButtons();
  updateInfoPanel();
  updateBoard();
}

function updateModeButtons() {
  modeButtons.forEach((button) => {
    const isSelected = button.dataset.mode === gameState.mode;
    button.classList.toggle("is-active", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });
}

function updateInfoPanel() {
  modeLabelElement.textContent =
    gameState.mode === "ai" ? "Jogador vs IA" : "Jogador vs Jogador";

  if (gameState.isGameActive) {
    turnIndicatorElement.textContent = gameState.currentPlayer;
  } else {
    turnIndicatorElement.textContent = gameState.winner || "-";
  }

  statusMessageElement.textContent = getStatusMessage();
}

function getStatusMessage() {
  if (gameState.winner) {
    if (gameState.mode === "ai") {
      return gameState.winner === "X" ? "Voce venceu a partida!" : "A IA venceu a partida!";
    }

    return `Jogador ${gameState.winner} venceu a partida!`;
  }

  if (!gameState.isGameActive) {
    return "Empate! Ninguem venceu desta vez.";
  }

  if (gameState.isComputerThinking) {
    return "A IA esta pensando na melhor jogada...";
  }

  if (gameState.mode === "ai") {
    return gameState.currentPlayer === "X" ? "Sua vez (X)." : "Vez da IA (O).";
  }

  return `Vez do jogador ${gameState.currentPlayer}.`;
}

function updateBoard() {
  cells.forEach((cell, index) => {
    const cellValue = gameState.board[index];
    const isWinningCell = gameState.winningCombination.includes(index);

    cell.textContent = cellValue;
    cell.disabled =
      !gameState.isGameActive ||
      gameState.isComputerThinking ||
      cellValue !== "";

    if (cellValue) {
      cell.dataset.player = cellValue;
      cell.setAttribute("aria-label", `Celula ${index + 1}: ${cellValue}`);
    } else {
      cell.removeAttribute("data-player");
      cell.setAttribute("aria-label", `Celula ${index + 1}`);
    }

    cell.classList.toggle("cell--winner", isWinningCell);
  });
}

initializeGame();
