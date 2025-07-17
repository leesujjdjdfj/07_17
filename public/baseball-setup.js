document.addEventListener("DOMContentLoaded", () => {
  // 사용자 정보
  const nickname = sessionStorage.getItem("playerNickname");
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");

  if (!nickname || !currentUser) {
    window.location.href = "/";
    return;
  }

  // --- DOM 요소 ---
  // 설정 화면 요소
  const setupFlowContainer = document.getElementById("setup-flow-container");
  const setupUserNickname = document.getElementById("setup-user-nickname");
  const digitOptions = document.querySelectorAll(".digit-option");
  const singleModeButton = document.getElementById("single-mode-button");
  const multiModeButton = document.getElementById("multi-mode-button");
  const multiOptionsCard = document.getElementById("multi-options-card");
  const createRoomBtn = document.getElementById("create-room-btn");
  const joinRoomBtn = document.getElementById("join-room-btn");
  const roomCodeInput = document.getElementById("room-code-input");
  const roomCreatedCard = document.getElementById("room-created-card");
  const generatedRoomCode = document.getElementById("generated-room-code");
  const copyRoomCode = document.getElementById("copy-room-code");

  // 비밀번호 설정 화면 요소
  const setNumberScreen = document.getElementById("set-number-screen");
  const setNumberInfo = document.getElementById("set-number-info");
  const secretInput = document.getElementById("secret-number-input");
  const setNumberButton = document.getElementById("set-number-button");

  // 인게임 화면 요소
  const baseballGameScreen = document.getElementById("baseball-game-screen");
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
  
  // 게임 종료 모달 요소
  const baseballGameOverModal = document.getElementById("baseball-game-over-modal");
  const baseballResultTitle = document.getElementById("baseball-result-title");
  const baseballResultMessage = document.getElementById("baseball-result-message");
  const baseballAnswerDisplay = document.getElementById("baseball-answer-display");
  const baseballPlayAgain = document.getElementById("baseball-play-again");

  // --- 상태 변수 ---
  let selectedDigits = 3;
  let ws = null;
  let roomCode = null;
  let mySecretNumber = "";
  let myGuessCount = 0;
  let opponentGuessCount = 0;
  let isMyTurn = false;

  // --- 초기화 ---
  init();

  function init() {
    setupUserNickname.textContent = currentUser.nickname;
    setupEventListeners();
    // 페이지 로드 시 버튼 비활성화
    disableSetupButtons();
    connectToServer();
  }
  
  function disableSetupButtons() {
      createRoomBtn.disabled = true;
      joinRoomBtn.disabled = true;
      roomCodeInput.disabled = true;
      multiModeButton.disabled = true;
  }

  function enableSetupButtons() {
      createRoomBtn.disabled = false;
      joinRoomBtn.disabled = false;
      roomCodeInput.disabled = false;
      multiModeButton.disabled = false;
  }

  // --- 이벤트 리스너 설정 ---
  function setupEventListeners() {
    // 자릿수 선택
    digitOptions.forEach((option) => {
      option.addEventListener("click", () => {
        digitOptions.forEach((opt) => opt.classList.remove("active"));
        option.classList.add("active");
        option.querySelector("input").checked = true;
        selectedDigits = Number.parseInt(option.dataset.digits);
      });
    });

    // 싱글 모드 버튼 (기존 기능 유지, game.html로 이동)
    singleModeButton.addEventListener("click", () => {
      window.location.href = `/game.html?type=baseball&mode=single&digits=${selectedDigits}`;
    });

    // 멀티 모드 버튼
    multiModeButton.addEventListener("click", () => {
      multiOptionsCard.classList.remove("hidden");
      multiModeButton.textContent = "설정 완료";
      multiModeButton.disabled = true;
    });

    // 방 만들기 버튼
    createRoomBtn.addEventListener("click", () => {
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      createRoomBtn.disabled = true;
      createRoomBtn.textContent = "방 생성 중...";
      ws.send(JSON.stringify({
        type: "create_game", gameType: "baseball", nickname: nickname, options: { digits: selectedDigits }
      }));
    });

    // 방 참가하기 버튼
    joinRoomBtn.addEventListener("click", () => {
      const code = roomCodeInput.value.trim();
      if (!code || !/^\d{4}$/.test(code)) {
        showNotification("올바른 4자리 방 코드를 입력해주세요.", "error");
        return;
      }
      joinRoomBtn.disabled = true;
      joinRoomBtn.textContent = "참가 중...";
      ws.send(JSON.stringify({ type: "join_game", roomCode: code, nickname: nickname }));
    });

    // 방 코드 복사 버튼
    copyRoomCode.addEventListener("click", async () => {
        const roomCodeToCopy = generatedRoomCode.textContent;
        try {
            await navigator.clipboard.writeText(roomCodeToCopy);
            showNotification("방 코드가 복사되었습니다!", "success");
        } catch (err) {
            showNotification("복사에 실패했습니다.", "error");
        }
    });

    // 비밀 숫자 설정 버튼
    setNumberButton.addEventListener("click", () => {
      const number = secretInput.value.trim();
      if (number.length !== selectedDigits || !/^\d+$/.test(number) || new Set(number).size !== number.length) {
        showNotification(`중복되지 않는 ${selectedDigits}자리 숫자를 입력해주세요.`, "error");
        return;
      }
      mySecretNumber = number;
      ws.send(JSON.stringify({ type: "set_secret", number: number, roomCode: roomCode }));
      setNumberButton.disabled = true;
      setNumberInfo.textContent = "상대방이 숫자를 정하기를 기다리는 중...";
    });

    // 인게임 이벤트 리스너
    baseballChatSend.addEventListener("click", sendBaseballChat);
    baseballChatInput.addEventListener("keypress", (e) => { if (e.key === "Enter") sendBaseballChat(); });
    baseballGuessButton.addEventListener("click", submitBaseballGuess);
    baseballGuessInput.addEventListener("keypress", (e) => { if (e.key === "Enter" && !baseballGuessButton.disabled) submitBaseballGuess(); });
    baseballSurrenderButton.addEventListener("click", () => { if (confirm("정말 게임을 포기하시겠습니까?")) ws.send(JSON.stringify({ type: "surrender" })); });
    baseballPlayAgain.addEventListener("click", () => {
      ws.send(JSON.stringify({ type: "play_again" }));
      baseballGameOverModal.classList.remove("show");
      document.body.classList.remove("win-effect", "lose-effect");
    });
  }

  // --- 웹소켓 연결 및 메시지 처리 ---
  function connectToServer() {
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    ws = new WebSocket(`${wsProtocol}//${window.location.host}`);
    ws.onopen = () => {
        console.log("서버에 연결되었습니다.");
        enableSetupButtons();
        showNotification("서버에 연결되었습니다.", "success");
    };
    ws.onmessage = (event) => handleServerMessage(JSON.parse(event.data));
    ws.onclose = () => {
        console.log("서버 연결이 끊어졌습니다.");
        disableSetupButtons();
        showNotification("서버 연결이 끊겼습니다. 재연결 중...", "error");
        setTimeout(connectToServer, 3000);
    };
    ws.onerror = (error) => {
        console.error("웹소켓 오류:", error);
        disableSetupButtons();
    };
  }

  function handleServerMessage(data) {
    console.log("서버 메시지:", data);
    switch (data.type) {
      case "game_created":
        roomCode = data.roomCode;
        multiOptionsCard.classList.add("hidden");
        roomCreatedCard.classList.remove("hidden");
        generatedRoomCode.textContent = data.roomCode;
        showNotification("방이 생성되었습니다! 친구를 기다리세요.", "success");
        break;

      case "prompt_secret":
        roomCode = data.roomCode || roomCode;
        selectedDigits = data.digits || selectedDigits;
        setupFlowContainer.classList.add("hidden");
        setNumberScreen.classList.remove("hidden");
        setNumberInfo.textContent = `${selectedDigits}자리 비밀 숫자를 정하세요 (중복 없이)`;
        secretInput.maxLength = selectedDigits;
        break;

      case "game_ready":
        setNumberScreen.classList.add("hidden");
        baseballGameScreen.classList.remove("hidden");
        initializeGameUI(data);
        break;

      case "update":
        updateGuessRecord(data);
        break;

      case "info":
        isMyTurn = data.isMyTurn;
        baseballGuessInput.disabled = !isMyTurn;
        baseballGuessButton.disabled = !isMyTurn;
        addChatMessage("", data.message, true);
        break;

      case "chat_message":
        addChatMessage(data.senderNickname, data.text);
        break;

      case "game_over":
        showGameOver(data);
        break;

      case "error":
        showNotification(data.message, "error");
        createRoomBtn.disabled = false;
        createRoomBtn.textContent = "방 만들기";
        joinRoomBtn.disabled = false;
        joinRoomBtn.textContent = "참가하기";
        break;
    }
  }

  // --- UI 업데이트 및 게임 로직 함수 ---
  function initializeGameUI(data) {
    myNicknameBaseballDisplay.textContent = data.myNickname;
    opponentNicknameBaseballDisplay.textContent = data.opponentNickname;
    myScoreBaseballDisplay.textContent = data.myScore;
    opponentScoreBaseballDisplay.textContent = data.opponentScore;
    mySecretBaseballDisplay.textContent = mySecretNumber;
    myGuessesBaseball.innerHTML = "";
    opponentGuessesBaseball.innerHTML = "";
    myGuessCount = 0;
    opponentGuessCount = 0;
    baseballChatBox.innerHTML = "";
    isMyTurn = data.isMyTurn;
    baseballGuessInput.disabled = !isMyTurn;
    baseballGuessButton.disabled = !isMyTurn;
    baseballGuessInput.maxLength = selectedDigits;
    addChatMessage("", data.message, true);
  }

  function updateGuessRecord(data) {
    const isMyGuess = data.by === "me";
    const container = isMyGuess ? myGuessesBaseball : opponentGuessesBaseball;
    const round = isMyGuess ? ++myGuessCount : ++opponentGuessCount;
    const isSuccess = data.result.includes(`${selectedDigits}S`);
    addGuessToRecord(container, round, data.guess, data.result, isSuccess, isMyGuess);
  }

  function showGameOver(data) {
    myScoreBaseballDisplay.textContent = data.myScore || myScoreBaseballDisplay.textContent;
    opponentScoreBaseballDisplay.textContent = data.opponentScore || opponentScoreBaseballDisplay.textContent;
    baseballResultTitle.textContent = data.result === "win" ? "🎉 승리!" : "😢 패배";
    baseballResultMessage.textContent = data.message;
    
    // 상대방 정답 표시 로직 수정
    const answerContainer = baseballAnswerDisplay.parentElement;
    if (data.opponentSecret) {
        baseballAnswerDisplay.textContent = data.opponentSecret;
        answerContainer.style.display = ''; // p 태그를 다시 보이게 함
    } else {
        // 정답 정보가 없는 경우(예: 승리 시) 해당 라인을 숨김
        answerContainer.style.display = 'none';
    }

    baseballGameOverModal.classList.add("show");
    baseballGuessInput.disabled = true;
    baseballGuessButton.disabled = true;
    if (data.result === "win") {
      document.body.classList.add("win-effect");
    } else {
      document.body.classList.add("lose-effect");
    }
  }

  function sendBaseballChat() {
    const message = baseballChatInput.value.trim();
    if (!message || !ws) return;
    ws.send(JSON.stringify({ type: "chat_message", text: message }));
    addChatMessage(nickname, message); // 내가 보낸 메시지 바로 표시
    baseballChatInput.value = "";
  }

  function submitBaseballGuess() {
    const guess = baseballGuessInput.value.trim();
    if (!guess || guess.length !== selectedDigits || !/^\d+$/.test(guess) || new Set(guess).size !== guess.length) {
      showNotification(`중복되지 않는 ${selectedDigits}자리 숫자를 입력해주세요.`, "error");
      return;
    }
    ws.send(JSON.stringify({ type: "guess", guess: guess }));
    baseballGuessInput.value = "";
  }

  function addGuessToRecord(container, round, guess, result, isSuccess = false, isMyGuess = true) {
    const card = document.createElement("div");
    card.className = `guess-card ${isMyGuess ? "mine" : "theirs"}`;
    if (isSuccess) card.classList.add("success");
    card.innerHTML = `<div class="round">${round}회차</div><div class="details">입력: ${guess} → 결과: ${result}</div>`;
    container.appendChild(card);
    container.scrollTop = container.scrollHeight;
  }

  function addChatMessage(sender, message, isSystem = false) {
    const chatMsg = document.createElement("div");
    if (isSystem) {
      chatMsg.className = "chat-msg system-chat";
      chatMsg.textContent = message;
    } else {
      const isMyMessage = sender === nickname;
      chatMsg.className = `chat-msg ${isMyMessage ? "mine-chat" : "their-chat"}`;
      chatMsg.textContent = isMyMessage ? message : `${sender}: ${message}`;
    }
    baseballChatBox.appendChild(chatMsg);
    baseballChatBox.scrollTop = baseballChatBox.scrollHeight;
  }

  function showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.style.cssText = `
      position: fixed; top: 20px; right: 20px; padding: 1rem 1.5rem;
      background: ${type === "success" ? "#27ae60" : type === "error" ? "#e74c3c" : "#3498db"};
      color: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      z-index: 10000; animation: slideIn 0.3s ease; font-weight: 500; max-width: 300px;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.style.animation = "slideOut 0.3s ease";
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
   const style = document.createElement("style");
  style.textContent = `
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
  `;
  document.head.appendChild(style);
});
