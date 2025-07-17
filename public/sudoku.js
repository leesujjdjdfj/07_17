document.addEventListener("DOMContentLoaded", () => {
    // DOM 요소들
    const boardElement = document.getElementById("sudoku-board");
    const numpad = document.getElementById("numpad");
    const difficultyElem = document.getElementById("sudoku-difficulty");
    const timerElem = document.getElementById("sudoku-timer");
    const mistakeElem = document.getElementById("mistake-counter");
    const scoreElem = document.getElementById("score-display");
    const resultModal = document.getElementById("sudoku-result-modal");
    const resultTitle = document.getElementById("sudoku-result-title");
    const resultMessage = document.getElementById("sudoku-result-message");
    const resultStats = document.getElementById("sudoku-result-stats");
    const spinner = document.getElementById("loading-spinner");
    const pauseOverlay = document.getElementById("pause-overlay");
    
    // 컨트롤 버튼들
    const pauseBtn = document.getElementById("pause-btn");
    const resumeBtn = document.getElementById("resume-btn");
    const undoBtn = document.getElementById("undo-btn");
    const eraseBtn = document.getElementById("erase-btn");
    const hintBtn = document.getElementById("hint-btn");
    const hintCountElem = document.getElementById("hint-count");
    const newGameBtn = document.getElementById("new-game-btn");

    // 게임 상태 변수들
    const urlParams = new URLSearchParams(window.location.search);
    const difficulty = urlParams.get("difficulty") || "easy";
    
    let board = [];
    let solution = [];
    let userBoard = [];
    let selectedCell = null;
    let timerInterval;
    let time = 1200; // 20분 = 1200초
    let mistakes = 0;
    let score = 0;
    let hintsUsed = 0;
    let gameHistory = [];
    let isPaused = false;
    let gameEnded = false;
    
    const MAX_MISTAKES = 3;
    const MAX_HINTS = 3;
    const difficultySettings = {
        easy: { empty: 35, name: "쉬움" },
        medium: { empty: 45, name: "보통" },
        hard: { empty: 55, name: "어려움" }
    };

    // 스도쿠 생성 및 검증 클래스
    class SudokuGenerator {
        static isValid(board, row, col, num) {
            // 행 검사
            for (let i = 0; i < 9; i++) {
                if (board[row][i] === num) return false;
            }
            
            // 열 검사
            for (let i = 0; i < 9; i++) {
                if (board[i][col] === num) return false;
            }
            
            // 3x3 박스 검사
            const startRow = Math.floor(row / 3) * 3;
            const startCol = Math.floor(col / 3) * 3;
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    if (board[startRow + i][startCol + j] === num) return false;
                }
            }
            
            return true;
        }

        static solveSudoku(board) {
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    if (board[row][col] === 0) {
                        const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
                        for (const num of numbers) {
                            if (this.isValid(board, row, col, num)) {
                                board[row][col] = num;
                                if (this.solveSudoku(board)) return true;
                                board[row][col] = 0;
                            }
                        }
                        return false;
                    }
                }
            }
            return true;
        }

        static generatePuzzle(difficulty) {
            // 완전한 스도쿠 보드 생성
            const solution = Array(9).fill(null).map(() => Array(9).fill(0));
            this.solveSudoku(solution);

            // 퍼즐 생성 (일부 셀 제거)
            const puzzle = solution.map(row => [...row]);
            const cellsToRemove = difficultySettings[difficulty].empty;

            let removed = 0;
            while (removed < cellsToRemove) {
                const row = Math.floor(Math.random() * 9);
                const col = Math.floor(Math.random() * 9);
                if (puzzle[row][col] !== 0) {
                    puzzle[row][col] = 0;
                    removed++;
                }
            }

            return { puzzle, solution: solution.map(row => [...row]) };
        }
    }

    // 타이머 시작
    function startTimer() {
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            if (!isPaused && !gameEnded) {
                time--;
                updateTimerDisplay();
                
                if (time <= 0) {
                    gameOver(false, "시간 초과!");
                }
            }
        }, 1000);
    }

    // 타이머 표시 업데이트
    function updateTimerDisplay() {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        timerElem.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // 시간 경고 색상
        if (time <= 300) { // 5분 이하
            timerElem.style.color = '#e74c3c';
        } else if (time <= 600) { // 10분 이하
            timerElem.style.color = '#f39c12';
        } else {
            timerElem.style.color = '#333';
        }
    }

    // 실수 카운터 업데이트
    function updateMistakeCounter() {
        mistakeElem.textContent = `실수: ${mistakes} / ${MAX_MISTAKES}`;
        if (mistakes >= 2) {
            mistakeElem.style.color = '#e74c3c';
        }
    }

    // 점수 업데이트
    function updateScore() {
        scoreElem.textContent = `점수: ${score}`;
    }

    // 힌트 카운터 업데이트
    function updateHintCounter() {
        const remaining = MAX_HINTS - hintsUsed;
        hintCountElem.textContent = `(${remaining})`;
        if (remaining <= 0) {
            hintBtn.disabled = true;
            hintBtn.style.opacity = '0.5';
        }
    }

    // 보드 그리기
    function drawBoard() {
        boardElement.innerHTML = "";
        
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const cell = document.createElement("div");
                cell.classList.add("sudoku-cell");
                cell.dataset.row = r;
                cell.dataset.col = c;
                
                // 주어진 숫자인지 확인
                const isGiven = board[r][c] !== 0;
                if (isGiven) {
                    cell.textContent = board[r][c];
                    cell.classList.add("given");
                } else if (userBoard[r][c] !== 0) {
                    cell.textContent = userBoard[r][c];
                    cell.classList.add("user-input");
                }
                
                // 3x3 박스 경계선
                if ((r === 2 || r === 5) && r !== 8) cell.style.borderBottomWidth = "3px";
                if ((c === 2 || c === 5) && c !== 8) cell.style.borderRightWidth = "3px";
                
                // 클릭 이벤트
                cell.addEventListener("click", () => selectCell(r, c));
                
                boardElement.appendChild(cell);
            }
        }
    }

    // 셀 선택
    function selectCell(row, col) {
        if (isPaused || gameEnded) return;
        
        // 이전 선택 해제
        document.querySelectorAll('.sudoku-cell').forEach(cell => {
            cell.classList.remove('selected', 'highlighted', 'same-number');
        });
        
        selectedCell = { row, col };
        const selectedElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        selectedElement.classList.add('selected');
        
        // 하이라이트 적용
        highlightRelatedCells(row, col);
    }

    // 관련 셀 하이라이트
    function highlightRelatedCells(row, col) {
        const selectedValue = userBoard[row][col] || board[row][col];
        
        document.querySelectorAll('.sudoku-cell').forEach(cell => {
            const r = parseInt(cell.dataset.row);
            const c = parseInt(cell.dataset.col);
            
            // 같은 행, 열, 3x3 박스 하이라이트
            if (r === row || c === col || 
                (Math.floor(r / 3) === Math.floor(row / 3) && Math.floor(c / 3) === Math.floor(col / 3))) {
                cell.classList.add('highlighted');
            }
            
            // 같은 숫자 하이라이트
            if (selectedValue !== 0 && 
                (userBoard[r][c] === selectedValue || board[r][c] === selectedValue)) {
                cell.classList.add('same-number');
            }
        });
    }

    // 숫자 입력
    function inputNumber(num) {
        if (!selectedCell || isPaused || gameEnded) return;
        
        const { row, col } = selectedCell;
        
        // 주어진 숫자는 변경 불가
        if (board[row][col] !== 0) return;
        
        // 히스토리 저장
        gameHistory.push({
            row,
            col,
            oldValue: userBoard[row][col],
            newValue: num
        });
        
        // 숫자 입력
        userBoard[row][col] = num;
        
        // 정답 확인
        if (num !== 0) {
            if (num === solution[row][col]) {
                score += 10;
                updateScore();
            } else {
                mistakes++;
                updateMistakeCounter();
                
                // 잘못된 입력 시각적 피드백
                const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                cellElement.classList.add('incorrect-temp');
                setTimeout(() => {
                    cellElement.classList.remove('incorrect-temp');
                }, 500);
                
                if (mistakes >= MAX_MISTAKES) {
                    gameOver(false, "실수 횟수 초과!");
                    return;
                }
            }
        }
        
        // 보드 다시 그리기
        drawBoard();
        selectCell(row, col); // 선택 상태 유지
        
        // 완성 확인
        checkCompletion();
    }

    // 완성 확인
    function checkCompletion() {
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const expected = solution[r][c];
                const actual = board[r][c] !== 0 ? board[r][c] : userBoard[r][c];
                
                if (actual !== expected) {
                    return false;
                }
            }
        }
        
        gameOver(true, "축하합니다!");
        return true;
    }

    // 실행 취소
    function undo() {
        if (gameHistory.length === 0 || isPaused || gameEnded) return;
        
        const lastMove = gameHistory.pop();
        userBoard[lastMove.row][lastMove.col] = lastMove.oldValue;
        
        drawBoard();
        if (selectedCell) {
            selectCell(selectedCell.row, selectedCell.col);
        }
    }

    // 힌트 사용
    function useHint() {
        if (!selectedCell || hintsUsed >= MAX_HINTS || isPaused || gameEnded) return;
        
        const { row, col } = selectedCell;
        
        // 이미 채워진 셀이면 힌트 불가
        if (board[row][col] !== 0 || userBoard[row][col] !== 0) return;
        
        hintsUsed++;
        updateHintCounter();
        inputNumber(solution[row][col]);
    }

    // 게임 일시정지/재개
    function togglePause() {
        isPaused = !isPaused;
        
        if (isPaused) {
            pauseOverlay.classList.remove('hidden');
            pauseBtn.textContent = '▶️';
        } else {
            pauseOverlay.classList.add('hidden');
            pauseBtn.textContent = '⏸️';
        }
    }

    // 게임 종료
    function gameOver(isWin, message) {
        gameEnded = true;
        clearInterval(timerInterval);
        
        resultTitle.textContent = isWin ? "🎉 성공!" : "😢 실패";
        resultTitle.style.color = isWin ? "#28a745" : "#e74c3c";
        resultMessage.textContent = message;
        
        // 통계 표시
        const timeUsed = 1200 - time;
        const minutes = Math.floor(timeUsed / 60);
        const seconds = timeUsed % 60;
        
        resultStats.innerHTML = `
            <div class="stat-item">
                <span class="stat-label">소요 시간:</span>
                <span class="stat-value">${minutes}분 ${seconds}초</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">실수 횟수:</span>
                <span class="stat-value">${mistakes}회</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">힌트 사용:</span>
                <span class="stat-value">${hintsUsed}회</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">최종 점수:</span>
                <span class="stat-value">${score}점</span>
            </div>
        `;
        
        resultModal.classList.remove("hidden");
    }

    // 새 게임 시작
    async function initSudoku() {
        spinner.style.display = 'flex';
        boardElement.style.display = 'none';
        
        // 퍼즐 생성 (비동기로 처리하여 UI 블로킹 방지)
        await new Promise(resolve => {
            setTimeout(() => {
                const { puzzle, solution: newSolution } = SudokuGenerator.generatePuzzle(difficulty);
                board = puzzle;
                solution = newSolution;
                userBoard = Array(9).fill(null).map(() => Array(9).fill(0));
                resolve();
            }, 100);
        });
        
        // 게임 상태 초기화
        selectedCell = null;
        time = 1200;
        mistakes = 0;
        score = 0;
        hintsUsed = 0;
        gameHistory = [];
        isPaused = false;
        gameEnded = false;
        
        // UI 업데이트
        difficultyElem.textContent = `난이도: ${difficultySettings[difficulty].name}`;
        updateTimerDisplay();
        updateMistakeCounter();
        updateScore();
        updateHintCounter();
        
        // 스피너 숨기고 보드 표시
        spinner.style.display = 'none';
        boardElement.style.display = 'grid';
        
        drawBoard();
        startTimer();
    }

    // 이벤트 리스너 설정
    function setupEventListeners() {
        // 숫자 패드
        numpad.addEventListener('click', (e) => {
            if (e.target.classList.contains('num-btn')) {
                const num = parseInt(e.target.dataset.num);
                inputNumber(num);
            }
        });
        
        // 컨트롤 버튼들
        pauseBtn.addEventListener('click', togglePause);
        resumeBtn.addEventListener('click', togglePause);
        undoBtn.addEventListener('click', undo);
        eraseBtn.addEventListener('click', () => inputNumber(0));
        hintBtn.addEventListener('click', useHint);
        newGameBtn.addEventListener('click', () => {
            resultModal.classList.add('hidden');
            initSudoku();
        });
        
        // 키보드 입력
        document.addEventListener('keydown', (e) => {
            if (isPaused || gameEnded) return;
            
            const key = e.key;
            if (key >= '1' && key <= '9') {
                inputNumber(parseInt(key));
            } else if (key === 'Backspace' || key === 'Delete' || key === '0') {
                inputNumber(0);
            } else if (key === 'z' && e.ctrlKey) {
                undo();
            } else if (key === 'h') {
                useHint();
            } else if (key === ' ') {
                e.preventDefault();
                togglePause();
            }
        });
        
        // 모달 닫기
        resultModal.addEventListener('click', (e) => {
            if (e.target === resultModal) {
                // 모달 외부 클릭으로는 닫지 않음 (게임 완료 후)
            }
        });
    }

    // 초기화
    setupEventListeners();
    initSudoku();
});