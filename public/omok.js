document.addEventListener('DOMContentLoaded', () => {
    // Game state variables
    let ws;
    let roomCode;
    let myColor;
    let isMyTurn = false;
    let selectedCoords = null;
    let timerInterval = null;
    let boardState = Array(15).fill(null).map(() => Array(15).fill(null));

    // DOM Elements
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

    // --- WebSocket Connection ---
    function connectToServer() {
        console.log('Attempting to connect to the server...');
        // In a real environment, you would use WebSocket.
        // For this example, we simulate the server responses.
    }

    // --- Game Initialization ---
    function resetGame() {
        boardState = Array(15).fill(null).map(() => Array(15).fill(null));
        stoneContainer.innerHTML = '';
        selectedCoords = null;
        confirmMoveBtn.disabled = true;
        surrenderBtn.disabled = false;
        previewMarker.style.display = 'none';
        gameOverModal.classList.add('hidden');
    }

    // --- Event Handlers ---
    createRoomBtn.addEventListener('click', () => {
        // In a real app: ws.send(JSON.stringify({ type: 'create_omok_room' }));
        const fakeRoomCode = Math.floor(1000 + Math.random() * 9000).toString();
        handleRoomCreated(fakeRoomCode);
    });

    joinRoomBtn.addEventListener('click', () => {
        const code = roomCodeInput.value.trim();
        if (code.length === 4) {
            // In a real app: ws.send(JSON.stringify({ type: 'join_omok_room', roomCode: code }));
            console.log(`Attempting to join room ${code}`);
            addChatMessage(`'${code}' 방에 참가를 시도합니다...`, 'system');
            // Simulate successful join and game start
            setTimeout(() => {
                handleGameStart({
                    players: [{ nickname: 'Opponent', color: 'black' }, { nickname: 'Me', color: 'white' }],
                    myColor: 'white',
                    turn: 'black'
                });
            }, 1500);
        } else {
            alert('Please enter a valid 4-digit room code.');
        }
    });
    
    boardArea.addEventListener('mousemove', (e) => {
        if (!isMyTurn) return;
        const { x, y } = getGridCoordinates(e);
        if (x >= 0 && x < 15 && y >= 0 && y < 15 && !boardState[y][x]) {
            movePreviewMarker(x, y);
        } else {
            previewMarker.style.display = 'none';
        }
    });

    boardArea.addEventListener('mouseleave', () => {
        previewMarker.style.display = 'none';
    });
    
    boardArea.addEventListener('click', (e) => {
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
        movePreviewMarker(x, y, true); // Make marker solid
        confirmMoveBtn.disabled = false;
    });

    confirmMoveBtn.addEventListener('click', () => {
        if (!selectedCoords || !isMyTurn) return;

        const { x, y } = selectedCoords;
        placeStone(x, y, myColor);

        if (checkWin(x, y, myColor)) {
            // ws.send({ type: 'game_over', ... });
            handleGameOver({ winner: myColor, reason: '오목을 완성했습니다!' });
            return;
        }

        // ws.send({ type: 'place_stone', ... });
        isMyTurn = false;
        updateTurnIndicator();
        stopTimer();
        selectedCoords = null;
        confirmMoveBtn.disabled = true;
        previewMarker.style.display = 'none';

        // Simulate opponent's move for local testing
        setTimeout(simulateOpponentMove, 1500);
    });

    surrenderBtn.addEventListener('click', () => {
        if (confirm('정말로 게임을 포기하시겠습니까?')) {
            // ws.send(JSON.stringify({ type: 'surrender' }));
            const winner = myColor === 'black' ? 'white' : 'black';
            handleGameOver({ winner, reason: '상대방이 기권했습니다.' });
        }
    });

    chatSendBtn.addEventListener('click', sendChatMessage);
    chatInputField.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });

    playAgainBtn.addEventListener('click', () => {
        // ws.send(JSON.stringify({ type: 'play_again' }));
        gameOverModal.classList.add('hidden');
        addChatMessage('다시하기를 요청했습니다. 상대방을 기다립니다.', 'system');
        setTimeout(() => handleGameStart({
             players: [{ nickname: 'Me', color: 'black' }, { nickname: 'Opponent', color: 'white' }],
             myColor: 'black',
             turn: 'black'
        }), 2000);
    });

    // --- Game Logic Functions ---
    function getGridCoordinates(e) {
        const rect = boardArea.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;

        const cellSize = rect.width / 14; // 14 spaces between 15 lines
        
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

    function checkWin(x, y, color) {
        const directions = [
            { dx: 1, dy: 0 },  // Horizontal
            { dx: 0, dy: 1 },  // Vertical
            { dx: 1, dy: 1 },  // Diagonal \
            { dx: 1, dy: -1 }  // Diagonal /
        ];

        for (const { dx, dy } of directions) {
            let count = 1;
            for (let i = 1; i < 5; i++) {
                const nx = x + i * dx;
                const ny = y + i * dy;
                if (nx >= 0 && nx < 15 && ny >= 0 && ny < 15 && boardState[ny][nx] === color) count++;
                else break;
            }
            for (let i = 1; i < 5; i++) {
                const nx = x - i * dx;
                const ny = y - i * dy;
                if (nx >= 0 && nx < 15 && ny >= 0 && ny < 15 && boardState[ny][nx] === color) count++;
                else break;
            }
            if (count >= 5) return true;
        }
        return false;
    }

    // --- UI and Messaging Functions ---
    function sendChatMessage() {
        const message = chatInputField.value.trim();
        if (message) {
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
        const p1Card = document.getElementById('player1-card');
        const p2Card = document.getElementById('player2-card');
        const turnPlayerColor = isMyTurn ? myColor : (myColor === 'black' ? 'white' : 'black');
        p1Card.classList.toggle('active', turnPlayerColor === 'black');
        p2Card.classList.toggle('active', turnPlayerColor === 'white');
    }

    // --- Timer Functions ---
    function startTimer() {
        let timeLeft = 30;
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
                handleGameOver({ winner: myColor === 'black' ? 'white' : 'black', reason: '시간 초과' });
            }
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timerInterval);
    }

    // --- Server Message Handlers (Simulated) ---
    function handleRoomCreated(code) {
        roomCode = code;
        roomCodeDisplay.textContent = roomCode;
        roomInfo.classList.remove('hidden');
        createRoomBtn.disabled = true;
        joinRoomBtn.parentElement.classList.add('hidden');
        waitingMessage.textContent = '상대방이 참가하기를 기다리는 중...';
        
        // Simulate opponent joining after a delay
        setTimeout(() => {
            if (gameScreen.classList.contains('hidden')) { // Only start if game hasn't started
                 handleGameStart({
                    players: [{ nickname: 'Me', color: 'black' }, { nickname: 'Opponent', color: 'white' }],
                    myColor: 'black',
                    turn: 'black'
                });
            }
        }, 3000);
    }

    function handleGameStart(data) {
        myColor = data.myColor;
        isMyTurn = data.turn === myColor;

        setupScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        
        resetGame();

        const myInfo = data.players.find(p => p.color === myColor);
        const opponentInfo = data.players.find(p => p.color !== myColor);
        
        const p1Name = document.getElementById('player1-name');
        const p2Name = document.getElementById('player2-name');

        if (myColor === 'black') {
            p1Name.textContent = `${myInfo.nickname} (나)`;
            p2Name.textContent = opponentInfo.nickname;
        } else {
            p1Name.textContent = opponentInfo.nickname;
            p2Name.textContent = `${myInfo.nickname} (나)`;
        }
        
        updateTurnIndicator();
        addChatMessage('두 플레이어가 모두 접속했습니다. 게임을 시작합니다!', 'system');
        addChatMessage(isMyTurn ? '당신의 턴입니다.' : '상대방의 턴입니다.', 'system');
        if (isMyTurn) startTimer();
    }

    function handleGameOver({ winner, reason }) {
        stopTimer();
        isMyTurn = false;
        confirmMoveBtn.disabled = true;
        surrenderBtn.disabled = true;
        previewMarker.style.display = 'none';

        const isWin = winner === myColor;
        resultTitle.textContent = isWin ? '🎉 승리! 🎉' : '😢 패배 😢';
        resultTitle.className = isWin ? 'win' : 'lose';
        resultMessage.textContent = reason;
        gameOverModal.classList.remove('hidden');
    }

    // --- Utility for Local Test ---
    function simulateOpponentMove() {
        const opponentColor = myColor === 'black' ? 'white' : 'black';
        const opponentMove = findRandomEmptyCell();
        if (opponentMove) {
            placeStone(opponentMove.x, opponentMove.y, opponentColor);
            if (checkWin(opponentMove.x, opponentMove.y, opponentColor)) {
                handleGameOver({ winner: opponentColor, reason: '상대방이 오목을 완성했습니다.' });
            } else {
                isMyTurn = true;
                updateTurnIndicator();
                startTimer();
                addChatMessage('당신의 턴입니다.', 'system');
            }
        }
    }

    function findRandomEmptyCell() {
        const emptyCells = [];
        for (let y = 0; y < 15; y++) {
            for (let x = 0; x < 15; x++) {
                if (!boardState[y][x]) {
                    emptyCells.push({ x, y });
                }
            }
        }
        return emptyCells.length > 0 ? emptyCells[Math.floor(Math.random() * emptyCells.length)] : null;
    }

    connectToServer();
});
