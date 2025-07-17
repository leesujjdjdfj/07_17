document.addEventListener('DOMContentLoaded', () => {
    // --- DOM 요소 ---
    const setupScreen = document.getElementById('setup-screen');
    const gameScreen = document.getElementById('game-screen');
    const createRoomBtn = document.getElementById('create-room-btn');
    const joinRoomBtn = document.getElementById('join-room-btn');
    const roomCodeInput = document.getElementById('room-code-input');
    const roomInfo = document.getElementById('room-info');
    const roomCodeDisplay = document.getElementById('room-code-display');
    const waitingMessage = document.getElementById('waiting-message');
    
    const boardArea = document.getElementById('board-area');
    const stoneContainer = document.getElementById('stone-container');
    const previewMarker = document.getElementById('preview-marker');

    const player1Name = document.getElementById('player1-name');
    const player2Name = document.getElementById('player2-name');
    const player1Card = document.getElementById('player1-card');
    const player2Card = document.getElementById('player2-card');

    const confirmMoveBtn = document.getElementById('confirm-move-btn');
    const surrenderBtn = document.getElementById('surrender-btn');
    const timerDisplay = document.getElementById('timer');
    const chatMessages = document.getElementById('chat-messages');
    const chatInputField = document.getElementById('chat-input-field');
    const chatSendBtn = document.getElementById('chat-send-btn');
    const gameOverModal = document.getElementById('game-over-modal');
    const resultTitle = document.getElementById('result-title');
    const resultMessage = document.getElementById('result-message');
    const playAgainBtn = document.getElementById('play-again-btn');

    // --- 게임 상태 변수 ---
    let ws;
    let roomCode;
    let myColor;
    let myNickname = sessionStorage.getItem("playerNickname") || `Guest${Math.floor(Math.random() * 1000)}`;
    let isMyTurn = false;
    let selectedCoords = null;
    let timerInterval = null;
    let boardState = Array(15).fill(null).map(() => Array(15).fill(null));

    // --- 초기화 ---
    function init() {
        // 버튼을 초기에 비활성화
        createRoomBtn.disabled = true;
        joinRoomBtn.disabled = true;
        roomCodeInput.disabled = true;
        
        setupEventListeners();
        connectToServer();
    }

    // --- 웹소켓 연결 ---
    function connectToServer() {
        const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        ws = new WebSocket(`${wsProtocol}//${window.location.host}`);

        ws.onopen = () => {
            console.log("서버에 연결되었습니다.");
            // 연결 성공 시 버튼 활성화
            createRoomBtn.disabled = false;
            joinRoomBtn.disabled = false;
            roomCodeInput.disabled = false;
            addChatMessage("서버에 연결되었습니다. 방을 만들거나 참가해주세요.", "system");
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log("서버 메시지 수신:", data);
                handleServerMessage(data);
            } catch (error) {
                console.error("메시지 파싱 오류:", error);
            }
        };

        ws.onclose = () => {
            console.log("서버 연결이 끊어졌습니다.");
            addChatMessage("서버와 연결이 끊겼습니다. 페이지를 새로고침 해주세요.", "system");
            disableAllButtons();
        };

        ws.onerror = (error) => {
            console.error("웹소켓 오류:", error);
            addChatMessage("서버 연결에 오류가 발생했습니다.", "system");
            disableAllButtons();
        };
    }
    
    function disableAllButtons() {
        createRoomBtn.disabled = true;
        joinRoomBtn.disabled = true;
        roomCodeInput.disabled = true;
        confirmMoveBtn.disabled = true;
        surrenderBtn.disabled = true;
    }

    // --- 서버 메시지 핸들러 ---
    function handleServerMessage(data) {
        switch (data.type) {
            case 'room_created':
                handleRoomCreated(data.roomCode);
                break;
            case 'game_start':
                handleGameStart(data);
                break;
            case 'turn_update':
                handleTurnUpdate(data);
                break;
            case 'board_update':
                handleBoardUpdate(data);
                break;
            case 'game_over':
                handleGameOver(data);
                break;
            case 'chat_message':
                addChatMessage(`${data.sender}: ${data.message}`, 'opponent');
                break;
            case 'error':
                alert(`오류: ${data.message}`);
                // 오류 발생 시 버튼 상태 초기화
                createRoomBtn.disabled = false;
                joinRoomBtn.disabled = false;
                roomCodeInput.disabled = false;
                break;
        }
    }

    // --- 이벤트 리스너 설정 ---
    function setupEventListeners() {
        createRoomBtn.addEventListener('click', () => {
            // 연결 상태 확인
            if (!ws || ws.readyState !== WebSocket.OPEN) {
                alert("서버에 연결되지 않았습니다. 잠시 후 다시 시도해주세요.");
                return;
            }
            createRoomBtn.disabled = true; // 중복 클릭 방지
            joinRoomBtn.disabled = true;
            ws.send(JSON.stringify({
                type: 'create_game',
                gameType: 'omok',
                nickname: myNickname
            }));
        });

        joinRoomBtn.addEventListener('click', () => {
            if (!ws || ws.readyState !== WebSocket.OPEN) {
                alert("서버에 연결되지 않았습니다. 잠시 후 다시 시도해주세요.");
                return;
            }
            const code = roomCodeInput.value.trim().toUpperCase();
            if (code.length === 4) {
                joinRoomBtn.disabled = true;
                createRoomBtn.disabled = true;
                ws.send(JSON.stringify({
                    type: 'join_game',
                    roomCode: code,
                    nickname: myNickname
                }));
            } else {
                alert('올바른 4자리 방 코드를 입력하세요.');
            }
        });

        boardArea.addEventListener('mousemove', handleBoardMouseMove);
        boardArea.addEventListener('mouseleave', () => { previewMarker.style.display = 'none'; });
        boardArea.addEventListener('click', handleBoardClick);
        confirmMoveBtn.addEventListener('click', handleConfirmMove);
        surrenderBtn.addEventListener('click', handleSurrender);
        chatSendBtn.addEventListener('click', sendChatMessage);
        chatInputField.addEventListener('keyup', (e) => { if (e.key === 'Enter') sendChatMessage(); });
        playAgainBtn.addEventListener('click', () => {
            ws.send(JSON.stringify({ type: 'play_again' }));
            gameOverModal.classList.add('hidden');
            addChatMessage('다시하기를 요청했습니다. 상대방의 응답을 기다립니다.', 'system');
        });
    }

    // --- UI 및 게임 로직 함수 ---

    function handleRoomCreated(code) {
        roomCode = code;
        roomCodeDisplay.textContent = roomCode;
        roomInfo.classList.remove('hidden');
        createRoomBtn.disabled = true;
        joinRoomBtn.parentElement.classList.add('hidden');
        waitingMessage.textContent = '상대방이 참가하기를 기다리는 중...';
    }

    function handleGameStart(data) {
        myColor = data.myColor;
        
        setupScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        
        resetGame();

        const p1 = data.players.find(p => p.color === 'black');
        const p2 = data.players.find(p => p.color === 'white');

        player1Name.textContent = p1.nickname === myNickname ? `${p1.nickname} (나)` : p1.nickname;
        player2Name.textContent = p2.nickname === myNickname ? `${p2.nickname} (나)` : p2.nickname;

        isMyTurn = data.turn === myColor;
        updateTurnIndicator();
        addChatMessage('두 플레이어가 모두 접속했습니다. 게임을 시작합니다!', 'system');
        if (isMyTurn) {
            addChatMessage('당신의 턴입니다.', 'system');
            startTimer(data.timeLimit);
        } else {
            addChatMessage('상대방의 턴입니다.', 'system');
        }
    }

    function resetGame() {
        boardState = Array(15).fill(null).map(() => Array(15).fill(null));
        stoneContainer.innerHTML = '';
        selectedCoords = null;
        confirmMoveBtn.disabled = true;
        surrenderBtn.disabled = false;
        previewMarker.style.display = 'none';
        gameOverModal.classList.add('hidden');
        chatMessages.innerHTML = '';
    }

    function handleBoardMouseMove(e) {
        if (!isMyTurn) return;
        const { x, y } = getGridCoordinates(e);
        if (x >= 0 && x < 15 && y >= 0 && y < 15 && !boardState[y][x]) {
            movePreviewMarker(x, y);
        } else {
            previewMarker.style.display = 'none';
        }
    }

    function handleBoardClick(e) {
        if (!isMyTurn) {
             addChatMessage('상대방의 턴입니다.', 'system');
             return;
        }
        const { x, y } = getGridCoordinates(e);

        if (x < 0 || x >= 15 || y < 0 || y >= 15) return;

        if (boardState[y][x]) {
            addChatMessage('이미 돌이 놓인 자리입니다.', 'system');
            return;
        }
        
        selectedCoords = { x, y };
        movePreviewMarker(x, y, true);
        confirmMoveBtn.disabled = false;
    }

    function handleConfirmMove() {
        if (!selectedCoords || !isMyTurn) return;
        
        ws.send(JSON.stringify({
            type: 'place_stone',
            ...selectedCoords
        }));

        isMyTurn = false;
        confirmMoveBtn.disabled = true;
        previewMarker.style.display = 'none';
        stopTimer();
    }

    function handleBoardUpdate(data) {
        placeStone(data.x, data.y, data.color);
    }
    
    function handleTurnUpdate(data) {
        isMyTurn = data.turn === myColor;
        updateTurnIndicator();
        stopTimer();
        if (isMyTurn) {
            addChatMessage('당신의 턴입니다.', 'system');
            startTimer(data.timeLimit);
        } else {
            addChatMessage('상대방의 턴입니다.', 'system');
        }
    }

    function handleSurrender() {
        if (confirm('정말로 게임을 포기하시겠습니까?')) {
            ws.send(JSON.stringify({ type: 'surrender' }));
        }
    }

    function getGridCoordinates(e) {
        const rect = boardArea.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;

        const cellSize = rect.width / 14;
        
        const x = Math.round(offsetX / cellSize);
        const y = Math.round(offsetY / cellSize);

        return { x, y };
    }

    function movePreviewMarker(x, y, isSelected = false) {
        const cellSize = boardArea.getBoundingClientRect().width / 14;
        previewMarker.style.left = `${x * cellSize}px`;
        previewMarker.style.top = `${y * cellSize}px`;
        previewMarker.style.backgroundColor = myColor;
        previewMarker.style.opacity = isSelected ? '1' : '0.5';
        previewMarker.style.display = 'block';
    }
    
    function placeStone(x, y, color) {
        if (boardState[y][x]) return;
        
        boardState[y][x] = color;
        const cellSize = boardArea.getBoundingClientRect().width / 14;

        const stone = document.createElement('div');
        stone.className = `stone ${color}`;
        stone.style.left = `${x * cellSize}px`;
        stone.style.top = `${y * cellSize}px`;
        
        stoneContainer.appendChild(stone);
    }

    function sendChatMessage() {
        const message = chatInputField.value.trim();
        if (message && ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'chat_message',
                message: message
            }));
            addChatMessage(`나: ${message}`, 'mine');
            chatInputField.value = '';
        }
    }

    function addChatMessage(text, type) {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('chat-msg', type);
        msgDiv.textContent = text;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function updateTurnIndicator() {
        const turnPlayerColor = isMyTurn ? myColor : (myColor === 'black' ? 'white' : 'black');
        player1Card.classList.toggle('active', turnPlayerColor === 'black');
        player2Card.classList.toggle('active', turnPlayerColor === 'white');
    }

    function startTimer(timeLimit = 30) {
        let timeLeft = timeLimit;
        timerDisplay.textContent = timeLeft;
        timerDisplay.className = '';
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = timeLeft;
            if (timeLeft <= 10) timerDisplay.classList.add('warning');
            if (timeLeft <= 5) timerDisplay.classList.add('danger');
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
            }
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timerInterval);
    }

    function handleGameOver({ winner, reason }) {
        stopTimer();
        isMyTurn = false;
        confirmMoveBtn.disabled = true;
        surrenderBtn.disabled = true;
        previewMarker.style.display = 'none';

        const isWin = winner === myNickname;
        resultTitle.textContent = isWin ? '🎉 승리! 🎉' : '😢 패배 😢';
        resultTitle.className = isWin ? 'win' : 'lose';
        resultMessage.textContent = reason;
        gameOverModal.classList.remove('hidden');
    }

    // 페이지 로드 시 초기화 실행
    init();
});
