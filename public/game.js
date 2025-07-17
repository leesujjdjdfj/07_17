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
      document.getElementById('opponent-guesses-baseball').parentElement.style.display = 'none';
      document.getElementById('my-secret-display').parentElement.style.display = 'none';
      
      // 채팅창을 시스템 로그로 사용
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
          const remainingAttemptsSpan = document.createElement('span');
          remainingAttemptsSpan.id = 'remaining-attempts';
          remainingAttemptsSpan.className = 'remaining-attempts';
          remainingAttemptsSpan.innerHTML = `남은 시도: <span id="remaining-count">${remainingTurns}</span> / ${maxTurns}`;
          scoreInfo.parentElement.appendChild(remainingAttemptsSpan);
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
        surrenderConfirmModal.classList.add("show");
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
          answerContainer.style.display = '';
      } else {
          answerContainer.style.display = 'none';
      }
      
      baseballGameOverModal.classList.add("show");
      body.classList.toggle("win-effect", isWin);
      body.classList.toggle("lose-effect", !isWin);
    }

    // 싱글플레이 UI 초기화 실행
    initializeSinglePlayerUI();
    return;
  }

  // ===================================================================
  // =================== 다른 게임 로직 (오목 등) ==================
  // ===================================================================
  // 이 부분은 숫자야구 외 다른 게임을 위해 유지됩니다.
  const setupScreen = document.getElementById("setup-screen");
  if(setupScreen) setupScreen.classList.remove("hidden");
  // ... (이하 다른 게임을 위한 기존 코드)
});
