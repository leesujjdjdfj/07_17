document.addEventListener("DOMContentLoaded", () => {
    // DOM 요소
    const navItems = document.querySelectorAll(".nav-item");
    const screens = document.querySelectorAll(".screen");
    const loginModal = document.getElementById("login-modal");
    const registerModal = document.getElementById("register-modal");
    const nicknameModal = document.getElementById("nickname-modal");
    const profileModal = document.getElementById("profile-modal");
    const loginBtn = document.getElementById("login-btn");
    const registerBtn = document.getElementById("register-btn");
    const profileBtn = document.getElementById("profile-btn");
    const logoutBtn = document.getElementById("logout-btn");
    const guestLoginBtn = document.querySelector(".guest-login-btn"); // 게스트 로그인 버튼
    const confirmNicknameBtn = document.getElementById("confirm-nickname-btn");

    // 사용자 상태
    let currentUser = null;

    // 초기화
    function init() {
        const savedUser = localStorage.getItem("currentUser");
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
        }
        updateUserInterface();
        setupEventListeners();
        showScreen("home"); // 항상 홈 화면으로 시작
    }

    // 이벤트 리스너 설정
    function setupEventListeners() {
        // 네비게이션 메뉴 클릭
        navItems.forEach(item => {
            item.addEventListener("click", (e) => {
                e.preventDefault();
                const targetMenu = item.dataset.menu;
                if (targetMenu) {
                    showScreen(targetMenu);
                }
            });
        });

        // 게임 카드 클릭 (이벤트 위임)
        const gameCardsContainer = document.querySelector(".game-cards");
        if (gameCardsContainer) {
            gameCardsContainer.addEventListener("click", (e) => {
                const gameCard = e.target.closest(".game-card");
                if (gameCard && !gameCard.classList.contains('disabled')) {
                    handleGameSelection(gameCard.dataset.game);
                }
            });
        }

        // 모달 관련 버튼
        loginBtn.addEventListener("click", () => showModal(loginModal));
        registerBtn.addEventListener("click", () => showModal(registerModal));
        profileBtn.addEventListener("click", () => {
            if (currentUser) showModal(profileModal);
            else alert("로그인이 필요합니다.");
        });
        logoutBtn.addEventListener("click", handleLogout);
        
        // 게스트 로그인은 닉네임 설정 모달을 띄움
        if(guestLoginBtn) {
            guestLoginBtn.addEventListener("click", () => {
                closeAllModals();
                showModal(nicknameModal);
            });
        }
        
        confirmNicknameBtn.addEventListener("click", confirmGuestNickname);

        // 모달 닫기 버튼
        document.querySelectorAll(".modal-close").forEach(btn => {
            btn.addEventListener("click", closeAllModals);
        });
        
        // 모달 오버레이 클릭 시 닫기
        document.querySelectorAll(".modal-overlay").forEach(overlay => {
            overlay.addEventListener("click", e => {
                if (e.target === overlay) closeAllModals();
            });
        });

        // 폼 제출
        document.getElementById("login-form").addEventListener("submit", handleLogin);
        document.getElementById("register-form").addEventListener("submit", handleRegister);
    }

    // 게임 선택 처리
    function handleGameSelection(gameType) {
        if (!currentUser) {
            alert("먼저 로그인해주세요!");
            showModal(loginModal);
            return;
        }
        // 각 게임의 설정 페이지로 이동
        const gameUrl = `/${gameType}-setup.html`;
        if (gameType === "omok") { // 오목은 setup 페이지가 없으므로 바로 이동
             window.location.href = `/${gameType}.html`;
        } else {
             window.location.href = gameUrl;
        }
    }

    // 화면 전환
    function showScreen(screenName) {
        screens.forEach(screen => {
            screen.classList.toggle("active", screen.id === `${screenName}-screen`);
        });
        navItems.forEach(item => {
            item.classList.toggle("active", item.dataset.menu === screenName);
        });
    }

    // 모달 관리
    function showModal(modal) {
        if (modal) modal.classList.remove("hidden");
    }
    function closeAllModals() {
        document.querySelectorAll(".modal-overlay").forEach(modal => {
            modal.classList.add("hidden");
        });
    }

    // UI 업데이트
    function updateUserInterface() {
        const guestSection = document.getElementById("guest-section");
        const userSection = document.getElementById("user-section");
        if (currentUser) {
            guestSection.classList.add("hidden");
            userSection.classList.remove("hidden");
            document.getElementById("user-nickname").textContent = currentUser.nickname;
            sessionStorage.setItem("playerNickname", currentUser.nickname);
        } else {
            guestSection.classList.remove("hidden");
            userSection.classList.add("hidden");
        }
    }

    // 로그아웃
    function handleLogout() {
        currentUser = null;
        localStorage.removeItem("currentUser");
        sessionStorage.removeItem("playerNickname");
        updateUserInterface();
        alert("로그아웃되었습니다.");
    }

    // 게스트 닉네임 설정
    function confirmGuestNickname() {
        const nicknameInput = document.getElementById('guest-nickname-input');
        const nickname = nicknameInput.value.trim();
        if (nickname.length >= 2 && nickname.length <= 10) {
            currentUser = { id: `guest_${Date.now()}`, nickname: nickname, isGuest: true };
            localStorage.setItem("currentUser", JSON.stringify(currentUser));
            updateUserInterface();
            closeAllModals();
        } else {
            alert("닉네임은 2~10글자로 입력해주세요.");
        }
    }

    // 로그인 처리
    function handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById("login-username").value;
        currentUser = { id: username, nickname: username, isGuest: false };
        localStorage.setItem("currentUser", JSON.stringify(currentUser));
        updateUserInterface();
        closeAllModals();
        alert(`${username}님, 환영합니다!`);
    }

    // 회원가입 처리
    function handleRegister(e) {
        e.preventDefault();
        alert("회원가입이 완료되었습니다. 로그인해주세요.");
        closeAllModals();
        showModal(loginModal);
    }

    // 초기화 함수 실행
    init();
});
