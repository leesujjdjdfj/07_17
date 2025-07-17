document.addEventListener("DOMContentLoaded", () => {
  // DOM 요소들
  const boardElement = document.getElementById("sudoku-board")
  const mainScoreElement = document.getElementById("main-score")
  const difficultyDisplay = document.getElementById("difficulty-display")
  const mistakeDisplay = document.getElementById("mistake-display")
  const timerDisplay = document.getElementById("timer-display")
  const pauseBtn = document.getElementById("pause-btn")
  const newGameBtn = document.getElementById("new-game-btn")
  const undoBtn = document.getElementById("undo-btn")
  const eraseBtn = document.getElementById("erase-btn")
  const hintBtn = document.getElementById("hint-btn")
  const hintCountElement = document.getElementById("hint-count")
  const numbersGrid = document.getElementById("numbers-grid")
  const loadingSpinner = document.getElementById("loading-spinner")
  const pauseOverlay = document.getElementById("pause-overlay")
  const resumeBtn = document.getElementById("resume-btn")
  const gameModal = document.getElementById("game-modal")
  const modalTitle = document.getElementById("modal-title")
  const modalMessage = document.getElementById("modal-message")
  const modalStats = document.getElementById("modal-stats")
  const restartBtn = document.getElementById("restart-btn")

  // 게임 상태
  let board = []
  let solution = []
  let userBoard = []
  let selectedCell = null
  const errorCells = new Set()
  let gameHistory = []
  let timer = 1200 // 20분
  let timerInterval
  let score = 0
  let mistakes = 0
  let hintsUsed = 0
  let isPaused = false
  let gameEnded = false
  const difficulty = "easy"

  const MAX_MISTAKES = 3
  const MAX_HINTS = 3
  const difficultySettings = {
    easy: { empty: 35, name: "쉬움" },
    medium: { empty: 45, name: "보통" },
    hard: { empty: 55, name: "어려움" },
  }

  // 스도쿠 생성기
  class SudokuGenerator {
    static isValid(board, row, col, num) {
      // 행 검사
      for (let i = 0; i < 9; i++) {
        if (board[row][i] === num) return false
      }

      // 열 검사
      for (let i = 0; i < 9; i++) {
        if (board[i][col] === num) return false
      }

      // 3x3 박스 검사
      const startRow = Math.floor(row / 3) * 3
      const startCol = Math.floor(col / 3) * 3
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          if (board[startRow + i][startCol + j] === num) return false
        }
      }

      return true
    }

    static solveSudoku(board) {
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (board[row][col] === 0) {
            const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5)
            for (const num of numbers) {
              if (this.isValid(board, row, col, num)) {
                board[row][col] = num
                if (this.solveSudoku(board)) return true
                board[row][col] = 0
              }
            }
            return false
          }
        }
      }
      return true
    }

    static generatePuzzle(difficulty) {
      // 완전한 스도쿠 보드 생성
      const solution = Array(9)
        .fill(null)
        .map(() => Array(9).fill(0))
      this.solveSudoku(solution)

      // 퍼즐 생성 (일부 셀 제거)
      const puzzle = solution.map((row) => [...row])
      const cellsToRemove = difficultySettings[difficulty].empty

      let removed = 0
      while (removed < cellsToRemove) {
        const row = Math.floor(Math.random() * 9)
        const col = Math.floor(Math.random() * 9)
        if (puzzle[row][col] !== 0) {
          puzzle[row][col] = 0
          removed++
        }
      }

      return { puzzle, solution: solution.map((row) => [...row]) }
    }
  }

  // 타이머 시작
  function startTimer() {
    clearInterval(timerInterval)
    timerInterval = setInterval(() => {
      if (!isPaused && !gameEnded) {
        timer--
        updateTimerDisplay()

        if (timer <= 0) {
          gameOver(false, "시간 초과!")
        }
      }
    }, 1000)
  }

  // 타이머 표시 업데이트
  function updateTimerDisplay() {
    const minutes = Math.floor(timer / 60)
    const seconds = timer % 60
    timerDisplay.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`

    // 시간 경고 색상
    if (timer <= 300) {
      // 5분 이하
      timerDisplay.style.color = "#d32f2f"
    } else if (timer <= 600) {
      // 10분 이하
      timerDisplay.style.color = "#f57c00"
    } else {
      timerDisplay.style.color = "#333"
    }
  }

  // UI 업데이트 함수들
  function updateScore() {
    mainScoreElement.textContent = score
  }

  function updateMistakes() {
    mistakeDisplay.textContent = `${mistakes}/3`
    if (mistakes >= 2) {
      mistakeDisplay.style.color = "#d32f2f"
    } else {
      mistakeDisplay.style.color = "#333"
    }
  }

  function updateHints() {
    const remaining = MAX_HINTS - hintsUsed
    hintCountElement.textContent = remaining
    if (remaining <= 0) {
      hintBtn.disabled = true
      hintBtn.style.opacity = "0.5"
    }
  }

  // 보드 그리기
  function drawBoard() {
    boardElement.innerHTML = ""

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = document.createElement("div")
        cell.classList.add("sudoku-cell")
        cell.dataset.row = r
        cell.dataset.col = c

        // 주어진 숫자인지 확인
        const isGiven = board[r][c] !== 0
        const userValue = userBoard[r][c]
        const cellKey = `${r}-${c}`

        if (isGiven) {
          cell.textContent = board[r][c]
          cell.classList.add("given")
        } else if (userValue !== 0) {
          cell.textContent = userValue
          cell.classList.add("user-input")

          // 틀린 숫자인지 확인
          if (errorCells.has(cellKey)) {
            cell.classList.add("error")
          }
        }

        // 3x3 박스 경계선
        if (c === 2 || c === 5) cell.classList.add("border-right-thick")
        if (r === 2 || r === 5) cell.classList.add("border-bottom-thick")

        // 클릭 이벤트
        cell.addEventListener("click", () => selectCell(r, c))

        boardElement.appendChild(cell)
      }
    }
  }

  // 셀 선택
  function selectCell(row, col) {
    if (isPaused || gameEnded) return

    // 이전 선택 해제
    clearHighlights()

    selectedCell = { row, col }
    const selectedElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`)
    selectedElement.classList.add("selected")

    // 하이라이트 적용
    highlightRelatedCells(row, col)
  }

  // 하이라이트 제거
  function clearHighlights() {
    document.querySelectorAll(".sudoku-cell").forEach((cell) => {
      cell.classList.remove("selected", "highlighted", "same-number")
    })
  }

  // 관련 셀 하이라이트
  function highlightRelatedCells(row, col) {
    const selectedValue = userBoard[row][col] || board[row][col]

    document.querySelectorAll(".sudoku-cell").forEach((cell) => {
      const r = Number.parseInt(cell.dataset.row)
      const c = Number.parseInt(cell.dataset.col)

      // 같은 행, 열, 3x3 박스 하이라이트
      if (
        r === row ||
        c === col ||
        (Math.floor(r / 3) === Math.floor(row / 3) && Math.floor(c / 3) === Math.floor(col / 3))
      ) {
        if (!(r === row && c === col)) {
          cell.classList.add("highlighted")
        }
      }

      // 같은 숫자 하이라이트
      if (selectedValue !== 0) {
        const cellValue = userBoard[r][c] || board[r][c]
        if (cellValue === selectedValue && !(r === row && c === col)) {
          cell.classList.add("same-number")
        }
      }
    })
  }

  // 숫자 입력
  function inputNumber(num) {
    if (!selectedCell || isPaused || gameEnded) return

    const { row, col } = selectedCell
    const cellKey = `${row}-${col}`

    // 주어진 숫자는 변경 불가
    if (board[row][col] !== 0) return

    // 히스토리 저장
    gameHistory.push({
      row,
      col,
      oldValue: userBoard[row][col],
      newValue: num,
      wasError: errorCells.has(cellKey),
    })

    // 이전 오류 상태 제거
    errorCells.delete(cellKey)

    // 숫자 입력
    userBoard[row][col] = num

    // 정답 확인
    if (num !== 0) {
      if (num === solution[row][col]) {
        // 정답
        score += 10
        updateScore()
      } else {
        // 오답
        errorCells.add(cellKey)
        mistakes++
        updateMistakes()

        if (mistakes >= MAX_MISTAKES) {
          setTimeout(() => gameOver(false, "실수 횟수 초과!"), 500)
          return
        }
      }
    }

    // 보드 다시 그리기
    drawBoard()
    selectCell(row, col) // 선택 상태 유지

    // 완성 확인
    if (num !== 0) {
      setTimeout(() => checkCompletion(), 100)
    }
  }

  // 완성 확인
  function checkCompletion() {
    // 오류가 있는 셀이 있으면 완성되지 않음
    if (errorCells.size > 0) return false

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const expected = solution[r][c]
        const actual = board[r][c] !== 0 ? board[r][c] : userBoard[r][c]

        if (actual !== expected) {
          return false
        }
      }
    }

    gameOver(true, "축하합니다!")
    return true
  }

  // 실행 취소
  function undo() {
    if (gameHistory.length === 0 || isPaused || gameEnded) return

    const lastMove = gameHistory.pop()
    const cellKey = `${lastMove.row}-${lastMove.col}`

    userBoard[lastMove.row][lastMove.col] = lastMove.oldValue

    // 오류 상태 복원
    if (lastMove.wasError) {
      errorCells.add(cellKey)
    } else {
      errorCells.delete(cellKey)
    }

    drawBoard()
    if (selectedCell) {
      selectCell(selectedCell.row, selectedCell.col)
    }
  }

  // 힌트 사용
  function useHint() {
    if (!selectedCell || hintsUsed >= MAX_HINTS || isPaused || gameEnded) return

    const { row, col } = selectedCell

    // 이미 채워진 셀이면 힌트 불가
    if (board[row][col] !== 0 || userBoard[row][col] !== 0) return

    hintsUsed++
    updateHints()
    inputNumber(solution[row][col])
  }

  // 게임 일시정지/재개
  function togglePause() {
    isPaused = !isPaused

    if (isPaused) {
      pauseOverlay.classList.remove("hidden")
      pauseBtn.textContent = "▶️"
    } else {
      pauseOverlay.classList.add("hidden")
      pauseBtn.textContent = "⏸️"
    }
  }

  // 게임 종료
  function gameOver(isWin, message) {
    gameEnded = true
    clearInterval(timerInterval)

    modalTitle.textContent = isWin ? "🎉 축하합니다!" : "😢 게임 오버"
    modalTitle.style.color = isWin ? "#4caf50" : "#f44336"
    modalMessage.textContent = message

    // 통계 표시
    const timeUsed = 1200 - timer
    const minutes = Math.floor(timeUsed / 60)
    const seconds = timeUsed % 60

    modalStats.innerHTML = `
            <div style="margin: 16px 0; padding: 16px; background: #f5f5f5; border-radius: 8px;">
                <div style="margin-bottom: 8px;">소요 시간: ${minutes}분 ${seconds}초</div>
                <div style="margin-bottom: 8px;">실수 횟수: ${mistakes}회</div>
                <div style="margin-bottom: 8px;">힌트 사용: ${hintsUsed}회</div>
                <div>최종 점수: ${score}점</div>
            </div>
        `

    gameModal.classList.remove("hidden")
  }

  // 새 게임 시작
  async function initSudoku() {
    loadingSpinner.classList.remove("hidden")
    boardElement.style.display = "none"

    // 퍼즐 생성
    await new Promise((resolve) => {
      setTimeout(() => {
        const { puzzle, solution: newSolution } = SudokuGenerator.generatePuzzle(difficulty)
        board = puzzle
        solution = newSolution
        userBoard = Array(9)
          .fill(null)
          .map(() => Array(9).fill(0))
        resolve()
      }, 100)
    })

    // 게임 상태 초기화
    selectedCell = null
    errorCells.clear()
    timer = 1200
    score = 0
    mistakes = 0
    hintsUsed = 0
    gameHistory = []
    isPaused = false
    gameEnded = false

    // UI 업데이트
    difficultyDisplay.textContent = difficultySettings[difficulty].name
    updateScore()
    updateMistakes()
    updateTimerDisplay()
    updateHints()

    // 스피너 숨기고 보드 표시
    loadingSpinner.classList.add("hidden")
    boardElement.style.display = "grid"

    drawBoard()
    startTimer()
  }

  // 이벤트 리스너 설정
  function setupEventListeners() {
    // 숫자 패드
    numbersGrid.addEventListener("click", (e) => {
      if (e.target.classList.contains("number-btn")) {
        const num = Number.parseInt(e.target.dataset.number)
        inputNumber(num)
      }
    })

    // 컨트롤 버튼들
    pauseBtn.addEventListener("click", togglePause)
    resumeBtn.addEventListener("click", togglePause)
    undoBtn.addEventListener("click", undo)
    eraseBtn.addEventListener("click", () => inputNumber(0))
    hintBtn.addEventListener("click", useHint)
    newGameBtn.addEventListener("click", () => {
      gameModal.classList.add("hidden")
      initSudoku()
    })
    restartBtn.addEventListener("click", () => {
      gameModal.classList.add("hidden")
      initSudoku()
    })

    // 키보드 입력
    document.addEventListener("keydown", (e) => {
      if (isPaused || gameEnded) return

      const key = e.key
      if (key >= "1" && key <= "9") {
        inputNumber(Number.parseInt(key))
      } else if (key === "Backspace" || key === "Delete" || key === "0") {
        inputNumber(0)
      } else if (key === "z" && e.ctrlKey) {
        undo()
      } else if (key === "h") {
        useHint()
      } else if (key === " ") {
        e.preventDefault()
        togglePause()
      }
    })
  }

  // 초기화
  setupEventListeners()
  initSudoku()
})
