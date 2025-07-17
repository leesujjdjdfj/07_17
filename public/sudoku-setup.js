document.addEventListener("DOMContentLoaded", () => {
    const nickname = sessionStorage.getItem("playerNickname");
    if (!nickname) {
        alert("로그인이 필요합니다.");
        window.location.href = "/";
        return;
    }
    document.getElementById("setup-user-nickname").textContent = nickname;

    const difficultyOptions = document.querySelectorAll(".difficulty-options .digit-option");
    const singleModeButton = document.getElementById("single-mode-button");
    const multiModeButton = document.getElementById("multi-mode-button");
    
    let selectedDifficulty = "easy";

    difficultyOptions.forEach(option => {
        option.addEventListener("click", () => {
            difficultyOptions.forEach(opt => opt.classList.remove("active"));
            option.classList.add("active");
            selectedDifficulty = option.dataset.difficulty;
        });
    });

    // 싱글플레이 버튼 클릭 시 sudoku-game.html로 난이도 정보와 함께 이동
    singleModeButton.addEventListener("click", () => {
        window.location.href = `/sudoku-game.html?difficulty=${selectedDifficulty}`;
    });
    
    multiModeButton.addEventListener('click', () => {
        alert('스도쿠 멀티플레이는 현재 개발 중입니다.');
    });
});
