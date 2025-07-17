document.addEventListener("DOMContentLoaded", () => {
  // URL 파라미터에서 게임 타입과 모드 가져오기
  const urlParams = new URLSearchParams(window.location.search);
  const gameType = urlParams.get("type");
  const gameMode = urlParams.get("mode");
  const gameDigits = Number.parseInt(urlParams.get("digits")) || 3;
  const nickname = sessionStorage.getItem("playerNickname");

  // --- 숫자야구 멀티플레이 리다이렉션 ---
  if (gameType === "baseball" && gameMode !== "single") {
    alert("숫자야구 멀티플레이는 새로운 설정 페이지에서 진행됩니다. 해당 페이지로 이동합니다.");
    window.location.href = "/baseball-setup.html";
    return;
  }

  if (!gameType || !nickname) {
    window.location.href = "/";
    return;
  }
  // ===================================================================
// 스도쿠 싱글 플레이 로직
// ===================================================================
function runSudoku() {
    const sudokuScreen = document.getElementById("sudoku-game-screen");
    if (!sudokuScreen) return;
    sudokuScreen.classList.remove("hidden");
    document.body.classList.add("game-active");

    const boardElement = document.getElementById("sudoku-board");
    const numpad = document.getElementById("numpad");
    const difficultyElem = document.getElementById("sudoku-difficulty");
    const timerElem = document.getElementById("sudoku-timer");
    const difficulty = new URLSearchParams(window.location.search).get("difficulty") || "easy";

    let board, solution, userBoard;
    let selectedCell = null;
    let timerInterval;
    let time = 0;

    const puzzles = {
        easy: ["6-2-5-8-1-8--2-4--7---1-9-----4-5-3---1---7-9-2-----8-1---3--9-7--6-1-3-2-4-7"],
        medium: ["--9748---7_--------2-1-9-----6---7-5-9-3---5-9-6---1-8---2---4----_--5-7-3--"],
        hard: ["-2-6-8---58---9-7----4----1-3-7--2---6----_----4-8--1-5-2----3--_--5---6-9-1-4-"]
    };

    function startTimer() {
        clearInterval(timerInterval);
        time = 0;
        timerInterval = setInterval(() => {
            time++;
            const minutes = String(Math.floor(time / 60)).padStart(2, '0');
            const seconds = String(time % 60).padStart(2, '0');
            timerElem.textContent = `${minutes}:${seconds}`;
        }, 1000);
    }

    function generatePuzzle() {
        const puzzleString = puzzles[difficulty][0].replace(/_/g, "---------");
        board = [];
        userBoard = [];
        for (let i = 0; i < 9; i++) {
            board.push(puzzleString.substring(i * 9, i * 9 + 9).split('').map(c => c === '-' ? 0 : parseInt(c)));
            userBoard.push(Array(9).fill(0));
        }
    }

    function drawBoard() {
        boardElement.innerHTML = "";
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const cell = document.createElement("div");
                cell.classList.add("sudoku-cell");
                if (board[r][c] !== 0) {
                    cell.textContent = board[r][c];
                    cell.classList.add("given");
                } else if (userBoard[r][c] !== 0) {
                    cell.textContent = userBoard[r][c];
                }
                cell.dataset.row = r;
                cell.dataset.col = c;
                if ((r === 2 || r === 5) && r !== 8) cell.style.borderBottomWidth = "3px";
                if ((c === 2 || c === 5) && c !== 8) cell.style.borderRightWidth = "3px";
                cell.addEventListener("click", () => selectCell(cell));
                boardElement.appendChild(cell);
            }
        }
    }

    function selectCell(cell) {
        if (cell.classList.contains("given")) return;
        if (selectedCell) selectedCell.classList.remove("selected");
        selectedCell = cell;
        selectedCell.classList.add("selected");
    }

    numpad.addEventListener("click", (e) => {
        if (e.target.tagName !== "BUTTON" || !selectedCell) return;
        
        const row = selectedCell.dataset.row;
        const col = selectedCell.dataset.col;

        if (e.target.classList.contains('erase-btn')) {
            selectedCell.textContent = "";
            userBoard[row][col] = 0;
        } else {
            const num = parseInt(e.target.textContent);
            selectedCell.textContent = num;
            userBoard[row][col] = num;
        }
    });

    function initSudoku() {
        difficultyElem.textContent = `난이도: ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`;
        generatePuzzle();
        drawBoard();
        startTimer();
    }
    
    document.getElementById('sudoku-reset-btn').addEventListener('click', initSudoku);

    initSudoku();
}

  

  // ===================================================================
  // =================== 싱글 플레이 모드 로직 =================
  // ===================================================================
  if (gameMode === "single" && gameType === "baseball") {
    const body = document.body;
    const baseballGameScreen = document.getElementById("baseball-game-screen");
    
    // UI 요소
    const headerTitle = document.querySelector(".baseball-header h1");
    const myNicknameBaseballDisplay = document.getElementById("my-nickname-display");
    const opponentNicknameBaseballDisplay = document.getElementById("opponent-nickname-display");
    const myScoreBaseballDisplay = document.getElementById("my-score-display");
    const opponentScoreBaseballDisplay = document.getElementById("opponent-score-display");
    const myGuessesBaseball = document.getElementById("my-guesses-baseball");
    const baseballChatBox = document.getElementById("baseball-chat-box");
    const baseballChatInput = document.getElementById("baseball-chat-input");
    const baseballChatSend = document.getElementById("baseball-chat-send");
    const baseballGuessInput = document.getElementById("baseball-guess-input");
    const baseballGuessButton = document.getElementById("baseball-guess-button");
    const baseballSurrenderButton = document.getElementById("baseball-surrender-button");
    
    // 모달 요소
    const baseballGameOverModal = document.getElementById("baseball-game-over-modal");
    const baseballResultTitle = document.getElementById("baseball-result-title");
    const baseballResultMessage = document.getElementById("baseball-result-message");
    const baseballAnswerDisplay = document.getElementById("baseball-answer-display");
    const baseballPlayAgain = document.getElementById("baseball-play-again");
    const surrenderConfirmModal = document.getElementById("surrender-confirm-modal");
    const confirmSurrenderBtn = document.getElementById("confirm-surrender-btn");
    const cancelSurrenderBtn = document.getElementById("cancel-surrender-btn");

    // 게임 상태 변수
    let computerSecretNumber = "";
    let attempts = 0;
    let gameEnded = false;
    let myScore = 0;
    const maxTurns = gameDigits === 3 ? 15 : gameDigits === 4 ? 25 : 50;
    let remainingTurns = maxTurns;

    // 초기화 함수
    function initializeSinglePlayerUI() {
      baseballGameScreen.classList.remove("hidden");
      document.body.classList.add("game-active");
      
      // 싱글플레이에 맞게 UI 텍스트 및 레이아웃 조정
      if (headerTitle) headerTitle.textContent = "⚾ 숫자야구 싱글";
      myNicknameBaseballDisplay.textContent = nickname;
      opponentNicknameBaseballDisplay.textContent = "컴퓨터";
      myScoreBaseballDisplay.textContent = myScore;
      opponentScoreBaseballDisplay.textContent = '∞';
      
      // 멀티플레이용 UI 숨기기
      const opponentPanel = document.getElementById('opponent-panel');
      if (opponentPanel) {
        opponentPanel.style.display = 'none';
      }
      
      // 채팅창을 시스템 로그로 사용
      const chatPanel = document.getElementById('baseball-chat-box').closest('.baseball-panel');
      if(chatPanel) {
          const chatTitle = chatPanel.querySelector('h2');
          if (chatTitle) chatTitle.textContent = '시스템 로그';
      }
      baseballChatInput.disabled = true;
      baseballChatSend.disabled = true;
      baseballChatInput.placeholder = "시스템 메시지 로그";

      addRemainingAttemptsDisplay();
      startNewSingleGame();
      setupSinglePlayerEvents();
    }

    // 남은 시도 횟수 표시 UI 추가
    function addRemainingAttemptsDisplay() {
      const scoreInfo = document.getElementById("score-info");
      if (scoreInfo) {
          let remainingAttemptsSpan = document.getElementById('remaining-attempts');
          if (!remainingAttemptsSpan) {
              remainingAttemptsSpan = document.createElement('span');
              remainingAttemptsSpan.id = 'remaining-attempts';
              remainingAttemptsSpan.className = 'remaining-attempts';
              scoreInfo.parentElement.appendChild(remainingAttemptsSpan);
          }
          remainingAttemptsSpan.innerHTML = `남은 시도: <span id="remaining-count">${remainingTurns}</span> / ${maxTurns}`;
          scoreInfo.style.display = 'none'; // 기존 점수 표시는 숨김
      }
    }

    // 남은 시도 횟수 업데이트
    function updateRemainingAttempts() {
      const remainingCountElement = document.getElementById("remaining-count");
      if (remainingCountElement) {
        remainingCountElement.textContent = remainingTurns;
        const remainingAttemptsElement = document.getElementById("remaining-attempts");
        if (remainingAttemptsElement) {
          remainingAttemptsElement.classList.remove("warning", "danger");
          if (remainingTurns <= 3) remainingAttemptsElement.classList.add("danger");
          else if (remainingTurns <= 7) remainingAttemptsElement.classList.add("warning");
        }
      }
    }

    // 새 게임 시작
    function startNewSingleGame() {
      generateComputerSecret();
      myGuessesBaseball.innerHTML = "";
      baseballChatBox.innerHTML = "";
      attempts = 0;
      gameEnded = false;
      remainingTurns = maxTurns;
      updateRemainingAttempts();
      baseballGuessInput.disabled = false;
      baseballGuessButton.disabled = false;
      baseballGuessInput.value = "";
      baseballGuessInput.maxLength = gameDigits;
      addSystemMessage(`컴퓨터가 ${gameDigits}자리 숫자를 정했습니다. 맞춰보세요!`);
      console.log(`[개발자 모드] 컴퓨터 정답: ${computerSecretNumber}`);
    }

    // 컴퓨터 비밀번호 생성
    function generateComputerSecret() {
      const numbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
      computerSecretNumber = "";
      for (let i = 0; i < gameDigits; i++) {
        const randomIndex = Math.floor(Math.random() * numbers.length);
        computerSecretNumber += numbers.splice(randomIndex, 1)[0];
      }
    }

    // 이벤트 리스너 설정
    function setupSinglePlayerEvents() {
      baseballGuessButton.addEventListener("click", submitSinglePlayerGuess);
      baseballGuessInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !baseballGuessButton.disabled) {
          submitSinglePlayerGuess();
        }
      });
      
      // 포기 버튼 클릭 시 모달 표시
      baseballSurrenderButton.addEventListener("click", () => {
        if (!gameEnded) {
            surrenderConfirmModal.classList.add("show");
        }
      });

      // 항복 확인 모달 "예" 버튼
      confirmSurrenderBtn.addEventListener("click", () => {
        if (!gameEnded) {
            endGame(false, "게임을 포기했습니다.");
        }
        surrenderConfirmModal.classList.remove("show");
      });

      // 항복 확인 모달 "취소" 버튼
      cancelSurrenderBtn.addEventListener("click", () => {
        surrenderConfirmModal.classList.remove("show");
      });

      // 다시하기 버튼
      baseballPlayAgain.addEventListener("click", () => {
        baseballGameOverModal.classList.remove("show");
        body.classList.remove("win-effect", "lose-effect");
        startNewSingleGame();
      });
    }

    // 추측 제출
    function submitSinglePlayerGuess() {
      if (gameEnded) return;
      const guess = baseballGuessInput.value.trim();
      if (!guess || guess.length !== gameDigits || !/^\d+$/.test(guess) || new Set(guess).size !== guess.length) {
        addSystemMessage(`중복되지 않는 ${gameDigits}자리 숫자를 입력해주세요.`);
        return;
      }
      
      attempts++;
      remainingTurns--;
      updateRemainingAttempts();
      
      const result = calculateResult(computerSecretNumber, guess);
      const isSuccess = result.strikes === gameDigits;
      addGuessToRecord(myGuessesBaseball, attempts, guess, `${result.strikes}S ${result.balls}B`, isSuccess);
      
      if (isSuccess) {
        myScore++;
        myScoreBaseballDisplay.textContent = myScore;
        addSystemMessage(`🎉 정답! ${attempts}번 만에 성공!`);
        endGame(true, `축하합니다! ${attempts}번 만에 정답을 맞췄습니다!`);
      } else if (remainingTurns <= 0) {
        addSystemMessage("기회를 모두 사용했습니다.");
        endGame(false, `아쉽네요. 정답은 ${computerSecretNumber}였습니다.`);
      }
      baseballGuessInput.value = "";
    }

    // 결과 계산
    function calculateResult(secret, guess) {
      let strikes = 0;
      let balls = 0;
      for (let i = 0; i < secret.length; i++) {
        if (secret[i] === guess[i]) strikes++;
        else if (secret.includes(guess[i])) balls++;
      }
      return { strikes, balls };
    }

    // 추측 기록 추가
    function addGuessToRecord(container, round, guess, result, isSuccess = false) {
      const card = document.createElement("div");
      card.className = `guess-card mine ${isSuccess ? "success" : ""}`;
      card.innerHTML = `<div class="round">${round}회차</div><div class="details">입력: ${guess} → 결과: ${result}</div>`;
      container.appendChild(card);
      container.scrollTop = container.scrollHeight;
    }

    // 시스템 메시지 추가
    function addSystemMessage(message) {
      const chatMsg = document.createElement("div");
      chatMsg.className = "chat-msg system-chat";
      chatMsg.textContent = message;
      baseballChatBox.appendChild(chatMsg);
      baseballChatBox.scrollTop = baseballChatBox.scrollHeight;
    }

    // 게임 종료 처리
    function endGame(isWin, message) {
      gameEnded = true;
      baseballGuessInput.disabled = true;
      baseballGuessButton.disabled = true;
      
      baseballResultTitle.textContent = isWin ? "🎉 승리!" : "😢 패배";
      baseballResultMessage.textContent = message;
      
      const answerContainer = baseballAnswerDisplay.parentElement;
      if (!isWin) {
          baseballAnswerDisplay.textContent = computerSecretNumber;
          if(answerContainer) answerContainer.style.display = '';
      } else {
          if(answerContainer) answerContainer.style.display = 'none';
      }
      
      baseballGameOverModal.classList.add("show");
      body.classList.toggle("win-effect", isWin);
      body.classList.toggle("lose-effect", !isWin);
    }

    // 싱글플레이 UI 초기화 실행
    initializeSinglePlayerUI();
    return;
  }
});
