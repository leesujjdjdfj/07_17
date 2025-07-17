document.addEventListener("DOMContentLoaded", () => {
  // URL 파라미터에서 게임 타입과 모드 가져오기
  const urlParams = new URLSearchParams(window.location.search);
  const gameType = urlParams.get("type");
  const gameMode = urlParams.get("mode");
  const gameDigits = Number.parseInt(urlParams.get("digits")) || 3;
  const nickname = sessionStorage.getItem("playerNickname");

  // --- 숫자야구 멀티플레이 리다이렉션 ---
  // 사용자가 이 페이지(game.html)에서 멀티플레이를 시작하려고 하면
  // 새로운 공식 설정 페이지(baseball-setup.html)로 보냅니다.
  if (gameType === "baseball" && gameMode !== "single") {
    alert("숫자야구 멀티플레이는 새로운 설정 페이지에서 진행됩니다. 해당 페이지로 이동합니다.");
    window.location.href = "/baseball-setup.html";
    return; // 이 페이지에서 더 이상 스크립트를 실행하지 않습니다.
  }

  if (!gameType || !nickname) {
    window.location.href = "/";
    return;
  }

  // ===================================================================
  // =================== 싱글 플레이 모드 로직 (변경 없음) =================
  // ===================================================================
  if (gameMode === "single" && gameType === "baseball") {
    // 기존 싱글 플레이어 로직은 여기에 그대로 유지됩니다.
    // ... (이하 싱글 플레이어 코드 생략)
    const body = document.body;
    const baseballGameScreen = document.getElementById("baseball-game-screen");
    const isSingleMode = true;
    const headerTitle = document.querySelector(".baseball-header h1");
    if (headerTitle) {
      headerTitle.textContent = "⚾ 숫자야구 싱글";
    }
    const isDevMode = false;
    const myNicknameBaseballDisplay = document.getElementById("my-nickname-display");
    const opponentNicknameBaseballDisplay = document.getElementById("opponent-nickname-display");
    const myScoreBaseballDisplay = document.getElementById("my-score-display");
    const opponentScoreBaseballDisplay = document.getElementById("opponent-score-display");
    const mySecretBaseballDisplay = document.getElementById("my-secret-display");
    const myGuessesBaseball = document.getElementById("my-guesses-baseball");
    const opponentGuessesBaseball = document.getElementById("opponent-guesses-baseball");
    const baseballChatBox = document.getElementById("baseball-chat-box");
    const baseballChatInput = document.getElementById("baseball-chat-input");
    const baseballChatSend = document.getElementById("baseball-chat-send");
    const baseballGuessInput = document.getElementById("baseball-guess-input");
    const baseballGuessButton = document.getElementById("baseball-guess-button");
    const baseballSurrenderButton = document.getElementById("baseball-surrender-button");
    const baseballGameOverModal = document.getElementById("baseball-game-over-modal");
    const baseballResultTitle = document.getElementById("baseball-result-title");
    const baseballResultMessage = document.getElementById("baseball-result-message");
    const baseballAnswerDisplay = document.getElementById("baseball-answer-display");
    const baseballPlayAgain = document.getElementById("baseball-play-again");
    let computerSecretNumber = "";
    let attempts = 0;
    let gameEnded = false;
    let myScore = 0;
    const computerScore = 0;
    const maxTurns = gameDigits === 3 ? 15 : gameDigits === 4 ? 25 : 50;
    let remainingTurns = maxTurns;
    window.toggleExpand = (id) => {
      const el = document.getElementById(id);
      if (el.style.maxHeight === "none") {
        el.style.maxHeight = "170px";
      } else {
        el.style.maxHeight = "none";
      }
    };
    baseballGameScreen.classList.remove("hidden");
    initializeSinglePlayerUI();
    function initializeSinglePlayerUI() {
      baseballGameScreen.classList.add("single-player");
      const baseballContent = document.querySelector(".baseball-content");
      if (baseballContent) {
        baseballContent.classList.add("single-player");
      }
      const panels = document.querySelectorAll(".baseball-panel");
      if (panels.length >= 2) {
        panels[1].remove();
      }
      const statsSection = document.querySelector(".stats-section");
      if (statsSection) {
        statsSection.style.display = "none";
      }
      myNicknameBaseballDisplay.textContent = nickname;
      opponentNicknameBaseballDisplay.textContent = "도전 과제";
      myScoreBaseballDisplay.textContent = myScore;
      opponentScoreBaseballDisplay.textContent = "∞";
      addRemainingAttemptsDisplay();
      startNewSingleGame();
      setupSinglePlayerEvents();
    }
    function addRemainingAttemptsDisplay() {
      const gameInfo = document.querySelector(".game-info");
      if (gameInfo) {
        gameInfo.innerHTML = `
      <span id="player-info">플레이어: <span id="my-nickname-display">${nickname}</span> vs <span id="opponent-nickname-display">도전 과제</span></span>
      <span id="remaining-attempts" class="remaining-attempts">남은 시도: <span id="remaining-count">${remainingTurns}</span> / ${maxTurns}</span>
    `;
      }
    }
    function updateRemainingAttempts() {
      const remainingCountElement = document.getElementById("remaining-count");
      if (remainingCountElement) {
        remainingCountElement.textContent = remainingTurns;
        const remainingAttemptsElement = document.getElementById("remaining-attempts");
        if (remainingAttemptsElement) {
          if (remainingTurns <= 3) {
            remainingAttemptsElement.classList.add("danger");
          } else if (remainingTurns <= 7) {
            remainingAttemptsElement.classList.add("warning");
          } else {
            remainingAttemptsElement.classList.remove("danger", "warning");
          }
        }
      }
    }
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
      addSystemMessage(`🔇 게임이 시작되었습니다! 컴퓨터의 ${gameDigits}자리 숫자를 맞춰보세요.`);
      if (isDevMode) {
        console.log(`[개발자 모드] 컴퓨터 정답: ${computerSecretNumber}`);
      }
    }
    function generateComputerSecret() {
      const numbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
      computerSecretNumber = "";
      for (let i = 0; i < gameDigits; i++) {
        const randomIndex = Math.floor(Math.random() * numbers.length);
        computerSecretNumber += numbers.splice(randomIndex, 1)[0];
      }
    }
    function setupSinglePlayerEvents() {
      baseballGuessButton.addEventListener("click", submitSinglePlayerGuess);
      baseballGuessInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !baseballGuessButton.disabled) {
          submitSinglePlayerGuess();
        }
      });
      baseballSurrenderButton.addEventListener("click", () => {
        if (confirm("정말 게임을 포기하시겠습니까?")) {
          endGame(false, "게임을 포기했습니다.");
        }
      });
      baseballPlayAgain.addEventListener("click", () => {
        baseballGameOverModal.classList.remove("show");
        body.classList.remove("win-effect", "lose-effect");
        startNewSingleGame();
      });
      baseballChatInput.disabled = true;
      baseballChatSend.disabled = true;
      baseballChatInput.placeholder = "시스템 메시지 로그";
    }
    function submitSinglePlayerGuess() {
      if (gameEnded) return;
      const guess = baseballGuessInput.value.trim();
      if (!guess || guess.length !== gameDigits) {
        alert(`${gameDigits}자리 숫자를 입력해주세요.`);
        return;
      }
      if (!/^\d+$/.test(guess)) {
        alert("숫자만 입력해주세요.");
        return;
      }
      if (new Set(guess).size !== guess.length) {
        alert("중복되지 않는 숫자를 입력해주세요.");
        return;
      }
      attempts++;
      remainingTurns--;
      updateRemainingAttempts();
      const result = calculateResult(computerSecretNumber, guess);
      const isSuccess = result.strikes === gameDigits;
      addGuessToRecord(myGuessesBaseball, attempts, guess, `${result.strikes}S ${result.balls}B`, isSuccess, true);
      if (isSuccess) {
        myScore++;
        myScoreBaseballDisplay.textContent = myScore;
        addSystemMessage(`🎉 정답을 맞췄습니다! ${attempts}번 만에 성공!`);
        endGame(true, `축하합니다! ${attempts}번 만에 정답을 맞췄습니다!`);
      } else if (remainingTurns <= 0) {
        addSystemMessage("기회를 모두 사용했습니다...");
        endGame(false, "삐빅 바보입니다");
      } else {
        addSystemMessage(`남은 기회: ${remainingTurns}번`);
      }
      baseballGuessInput.value = "";
    }
    function calculateResult(secret, guess) {
      let strikes = 0;
      let balls = 0;
      for (let i = 0; i < secret.length; i++) {
        if (secret[i] === guess[i]) {
          strikes++;
        } else if (secret.includes(guess[i])) {
          balls++;
        }
      }
      return { strikes, balls };
    }
    function addGuessToRecord(container, round, guess, result, isSuccess = false, isMyGuess = true) {
      const card = document.createElement("div");
      card.className = `guess-card ${isMyGuess ? "mine" : "theirs"}`;
      if (isSuccess) {
        card.classList.add("success");
      }
      card.innerHTML = `
        <div class="round">${round}회차</div>
        <div class="details">입력: ${guess} → 결과: ${result}</div>
      `;
      container.appendChild(card);
      container.scrollTop = container.scrollHeight;
    }
    function addSystemMessage(message) {
      const chatMsg = document.createElement("div");
      chatMsg.className = "chat-msg system-chat";
      chatMsg.textContent = message;
      baseballChatBox.appendChild(chatMsg);
      baseballChatBox.scrollTop = baseballChatBox.scrollHeight;
    }
    function endGame(isWin, message) {
      gameEnded = true;
      baseballGuessInput.disabled = true;
      baseballGuessButton.disabled = true;
      baseballResultTitle.textContent = isWin ? "🎉 승리!" : "😢 패배";
      baseballResultMessage.textContent = message;
      baseballAnswerDisplay.textContent = "***";
      const answerSection = baseballAnswerDisplay.parentElement;
      if (answerSection) {
        answerSection.style.display = "none";
      }
      baseballGameOverModal.classList.add("show");
      if (isWin) {
        body.classList.add("win-effect");
        createConfettiEffect();
      } else {
        body.classList.add("lose-effect");
      }
    }
    function createConfettiEffect() {
      for (let i = 0; i < 50; i++) {
        setTimeout(() => {
          const confetti = document.createElement("div");
          confetti.style.cssText = `
            position: fixed; top: -10px; left: ${Math.random() * 100}%;
            width: 10px; height: 10px;
            background: ${["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#feca57"][Math.floor(Math.random() * 5)]};
            z-index: 10000; animation: confetti-fall 3s linear forwards; pointer-events: none;
          `;
          document.body.appendChild(confetti);
          setTimeout(() => {
            document.body.removeChild(confetti);
          }, 3000);
        }, i * 100);
      }
    }
    const style = document.createElement("style");
    style.textContent = `@keyframes confetti-fall { to { transform: translateY(100vh) rotate(360deg); opacity: 0; } }`;
    document.head.appendChild(style);
    return;
  }

  // ===================================================================
  // =================== 멀티 플레이 모드 로직 (오목 등) ==================
  // ===================================================================
  // 이 부분은 오목과 같은 다른 게임의 멀티플레이를 위해 남겨둡니다.
  // 숫자야구는 위에서 처리되었으므로 이 로직을 실행하지 않습니다.
  const setupScreen = document.getElementById("setup-screen");
  setupScreen.classList.remove("hidden");
  // ... (이하 다른 게임을 위한 기존 코드)
});
