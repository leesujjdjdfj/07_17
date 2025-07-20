#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
숫자야구 게임 테스트 스크립트
"""

from bulls_and_cows_multiplayer import BullsAndCowsGame

def test_game_functionality():
    """게임의 핵심 기능들을 테스트합니다."""
    print("🧪 숫자야구 게임 테스트 시작")
    print("=" * 50)
    
    # 게임 인스턴스 생성
    game = BullsAndCowsGame()
    
    # 1. 숫자 검증 테스트
    print("\n1. 숫자 검증 테스트:")
    test_cases = [
        ("123", True, "유효한 3자리 숫자"),
        ("1234", False, "4자리 숫자 (3자리 설정에서)"),
        ("12", False, "2자리 숫자"),
        ("11", False, "중복 숫자"),
        ("abc", False, "문자 포함"),
        ("1a2", False, "숫자가 아닌 문자 포함"),
        ("", False, "빈 문자열")
    ]
    
    for test_input, expected, description in test_cases:
        result = game.validate_number(test_input)
        status = "✅ 통과" if result == expected else "❌ 실패"
        print(f"  {test_input:5} → {result:5} ({description}) {status}")
    
    # 2. 결과 계산 테스트
    print("\n2. 결과 계산 테스트:")
    game.digits = 3
    secret = "123"
    
    test_cases = [
        ("123", (3, 0), "완전 일치 (3스트라이크)"),
        ("124", (2, 0), "2자리 일치 (2스트라이크)"),
        ("321", (1, 2), "1스트라이크 2볼"),
        ("312", (0, 3), "3볼"),
        ("456", (0, 0), "아웃"),
        ("145", (1, 0), "1스트라이크"),
        ("213", (1, 2), "1스트라이크 2볼")
    ]
    
    for guess, expected, description in test_cases:
        strikes, balls = game.calculate_result(secret, guess)
        result = (strikes, balls)
        status = "✅ 통과" if result == expected else "❌ 실패"
        formatted_result = game.format_result(strikes, balls)
        print(f"  비밀: {secret}, 추측: {guess} → {result} ({formatted_result}) - {description} {status}")
    
    # 3. 다양한 자리 수 테스트
    print("\n3. 다양한 자리 수 테스트:")
    for digits in [3, 4, 5]:
        game.digits = digits
        test_number = "1234567890"[:digits]
        result = game.validate_number(test_number)
        print(f"  {digits}자리: {test_number} → {'✅ 유효' if result else '❌ 무효'}")
    
    print("\n🎉 모든 테스트 완료!")

def demo_game_flow():
    """게임 흐름 데모를 실행합니다."""
    print("\n" + "=" * 50)
    print("🎮 게임 흐름 데모")
    print("=" * 50)
    
    game = BullsAndCowsGame()
    game.digits = 3
    game.player1_secret = "123"
    game.player2_secret = "456"
    
    print(f"\n설정된 비밀 숫자:")
    print(f"• 플레이어 1: {game.player1_secret}")
    print(f"• 플레이어 2: {game.player2_secret}")
    
    print(f"\n게임 시뮬레이션:")
    
    # 플레이어 1의 추측들
    player1_guesses = ["789", "156", "126", "123"]  # 마지막이 정답
    player2_guesses = ["789", "123", "145"]
    
    for round_num in range(1, 5):
        print(f"\n--- 라운드 {round_num} ---")
        
        # 플레이어 1 턴
        if round_num - 1 < len(player1_guesses):
            guess = player1_guesses[round_num - 1]
            strikes, balls = game.calculate_result(game.player2_secret, guess)
            result = game.format_result(strikes, balls)
            game.game_history["player1"].append((guess, result))
            print(f"플레이어 1 → {guess}: {result}")
            
            if strikes == game.digits:
                print("🎉 플레이어 1이 승리했습니다!")
                break
        
        # 플레이어 2 턴
        if round_num - 1 < len(player2_guesses):
            guess = player2_guesses[round_num - 1]
            strikes, balls = game.calculate_result(game.player1_secret, guess)
            result = game.format_result(strikes, balls)
            game.game_history["player2"].append((guess, result))
            print(f"플레이어 2 → {guess}: {result}")
            
            if strikes == game.digits:
                print("🎉 플레이어 2가 승리했습니다!")
                break
    
    print(f"\n📊 최종 게임 기록:")
    for player_key, player_name in [("player1", "플레이어 1"), ("player2", "플레이어 2")]:
        print(f"\n{player_name}:")
        for i, (guess, result) in enumerate(game.game_history[player_key], 1):
            print(f"  {i}. {guess} → {result}")

if __name__ == "__main__":
    test_game_functionality()
    demo_game_flow()
    
    print(f"\n" + "=" * 50)
    print("📋 게임 실행 방법:")
    print("=" * 50)
    print("터미널에서 다음 명령어를 실행하세요:")
    print("python3 bulls_and_cows_multiplayer.py")
    print("\n게임 특징:")
    print("• 3, 4, 5자리 중 선택 가능")
    print("• 두 명이 번갈아가며 플레이")
    print("• 입력 검증 및 게임 기록 관리")
    print("• 직관적인 UI와 결과 표시")