#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
멀티플레이어 숫자야구(Bulls and Cows) 게임
두 명의 플레이어가 번갈아가며 상대방의 비밀 숫자를 맞추는 게임입니다.
"""

import os
import re
from typing import List, Tuple, Dict, Any


class BullsAndCowsGame:
    """숫자야구 게임 클래스"""
    
    def __init__(self):
        self.digits = 3  # 기본 자리 수
        self.player1_secret = ""
        self.player2_secret = ""
        self.current_player = 1
        self.game_history = {"player1": [], "player2": []}
        self.max_attempts = 20  # 최대 시도 횟수
    
    def clear_screen(self):
        """화면을 지웁니다."""
        os.system('clear' if os.name == 'posix' else 'cls')
    
    def validate_number(self, number: str) -> bool:
        """입력된 숫자가 유효한지 검증합니다."""
        # 길이 검증
        if len(number) != self.digits:
            return False
        
        # 숫자인지 검증
        if not number.isdigit():
            return False
        
        # 중복 숫자 검증
        if len(set(number)) != len(number):
            return False
        
        return True
    
    def calculate_result(self, secret: str, guess: str) -> Tuple[int, int]:
        """추측과 비밀번호를 비교하여 스트라이크와 볼의 개수를 반환합니다."""
        strikes = 0
        balls = 0
        
        # 스트라이크 계산 (자리수와 숫자가 모두 맞는 경우)
        for i in range(len(secret)):
            if secret[i] == guess[i]:
                strikes += 1
        
        # 볼 계산 (숫자는 맞지만 자리수가 다른 경우)
        for digit in guess:
            if digit in secret:
                balls += 1
        
        # 볼에서 스트라이크 제외
        balls -= strikes
        
        return strikes, balls
    
    def format_result(self, strikes: int, balls: int) -> str:
        """결과를 포맷팅하여 반환합니다."""
        if strikes == 0 and balls == 0:
            return "아웃"
        elif strikes == self.digits:
            return f"{strikes} 스트라이크 - 정답!"
        else:
            result = []
            if strikes > 0:
                result.append(f"{strikes} 스트라이크")
            if balls > 0:
                result.append(f"{balls} 볼")
            return " ".join(result)
    
    def get_secret_number(self, player_name: str) -> str:
        """플레이어로부터 비밀 숫자를 입력받습니다."""
        while True:
            self.clear_screen()
            print("=" * 50)
            print("🎯 숫자야구 멀티플레이어 게임")
            print("=" * 50)
            print(f"\n{player_name}님, 비밀 숫자를 입력해주세요.")
            print(f"• {self.digits}자리 숫자")
            print("• 중복되지 않는 숫자")
            print("• 예시:", "123" if self.digits == 3 else "1234" if self.digits == 4 else "12345")
            print("-" * 30)
            
            secret = input(f"비밀 숫자 ({self.digits}자리): ").strip()
            
            if self.validate_number(secret):
                print(f"\n✅ '{secret}'가 비밀 숫자로 설정되었습니다!")
                input("\n다음 플레이어에게 넘겨주세요. (Enter를 눌러 계속...)")
                return secret
            else:
                print(f"\n❌ 잘못된 입력입니다!")
                print(f"• {self.digits}자리 숫자여야 합니다.")
                print("• 모든 자리수가 서로 다른 숫자여야 합니다.")
                input("\n다시 입력해주세요. (Enter를 눌러 계속...)")
    
    def get_guess(self, player_name: str, opponent_name: str, attempt: int) -> str:
        """플레이어로부터 추측 숫자를 입력받습니다."""
        while True:
            self.clear_screen()
            print("=" * 50)
            print("🎯 숫자야구 멀티플레이어 게임")
            print("=" * 50)
            print(f"\n{player_name}님의 턴 (시도 {attempt}/{self.max_attempts})")
            print(f"🎯 {opponent_name}님의 비밀 숫자를 맞춰보세요!")
            print("-" * 30)
            
            # 이전 기록 표시
            history_key = f"player{self.current_player}"
            if self.game_history[history_key]:
                print("\n📊 이전 기록:")
                for i, (guess, result) in enumerate(self.game_history[history_key][-5:], 1):
                    print(f"  {len(self.game_history[history_key])-5+i:2d}. {guess} → {result}")
                print("-" * 30)
            
            guess = input(f"\n추측 숫자 ({self.digits}자리): ").strip()
            
            if self.validate_number(guess):
                return guess
            else:
                print(f"\n❌ 잘못된 입력입니다!")
                print(f"• {self.digits}자리 숫자여야 합니다.")
                print("• 모든 자리수가 서로 다른 숫자여야 합니다.")
                input("\n다시 입력해주세요. (Enter를 눌러 계속...)")
    
    def show_game_summary(self, winner: str = None):
        """게임 결과 요약을 표시합니다."""
        self.clear_screen()
        print("=" * 50)
        print("🏆 게임 결과")
        print("=" * 50)
        
        if winner:
            print(f"\n🎉 {winner}님이 승리했습니다!")
        else:
            print(f"\n⏰ 게임이 종료되었습니다. (최대 시도 횟수 {self.max_attempts}회 도달)")
        
        print(f"\n📊 최종 기록:")
        print(f"• 플레이어 1 비밀 숫자: {self.player1_secret}")
        print(f"• 플레이어 2 비밀 숫자: {self.player2_secret}")
        
        print(f"\n📈 시도 기록:")
        for player_key, player_name in [("player1", "플레이어 1"), ("player2", "플레이어 2")]:
            print(f"\n{player_name}:")
            if self.game_history[player_key]:
                for i, (guess, result) in enumerate(self.game_history[player_key], 1):
                    print(f"  {i:2d}. {guess} → {result}")
            else:
                print("  시도 기록이 없습니다.")
    
    def setup_game(self):
        """게임 설정을 진행합니다."""
        self.clear_screen()
        print("=" * 50)
        print("🎯 숫자야구 멀티플레이어 게임")
        print("=" * 50)
        print("\n환영합니다! 숫자야구 게임에 오신 것을 환영합니다.")
        print("\n게임 규칙:")
        print("• 각자 비밀 숫자를 설정합니다.")
        print("• 번갈아가며 상대방의 숫자를 맞춰보세요.")
        print("• 스트라이크: 숫자와 자리수가 모두 맞음")
        print("• 볼: 숫자는 맞지만 자리수가 다름")
        print("• 아웃: 맞는 숫자가 하나도 없음")
        
        # 자리 수 선택
        while True:
            print("\n" + "-" * 30)
            choice = input("자리 수를 선택하세요 (3/4/5): ").strip()
            if choice in ['3', '4', '5']:
                self.digits = int(choice)
                break
            else:
                print("❌ 3, 4, 5 중에서 선택해주세요.")
        
        print(f"\n✅ {self.digits}자리 숫자야구 게임으로 설정되었습니다!")
        input("\n게임을 시작하려면 Enter를 눌러주세요...")
        
        # 비밀 숫자 입력
        self.player1_secret = self.get_secret_number("플레이어 1")
        self.player2_secret = self.get_secret_number("플레이어 2")
    
    def play_game(self):
        """게임을 진행합니다."""
        attempt = 1
        
        while attempt <= self.max_attempts:
            # 현재 플레이어 정보
            if self.current_player == 1:
                player_name = "플레이어 1"
                opponent_name = "플레이어 2"
                secret = self.player2_secret
                history_key = "player1"
            else:
                player_name = "플레이어 2"
                opponent_name = "플레이어 1"
                secret = self.player1_secret
                history_key = "player2"
            
            # 추측 입력
            guess = self.get_guess(player_name, opponent_name, attempt)
            
            # 결과 계산
            strikes, balls = self.calculate_result(secret, guess)
            result = self.format_result(strikes, balls)
            
            # 기록 저장
            self.game_history[history_key].append((guess, result))
            
            # 결과 표시
            self.clear_screen()
            print("=" * 50)
            print("🎯 결과 발표")
            print("=" * 50)
            print(f"\n{player_name}님의 추측: {guess}")
            print(f"결과: {result}")
            
            # 승리 조건 확인
            if strikes == self.digits:
                input(f"\n🎉 {player_name}님이 승리했습니다! (Enter를 눌러 계속...)")
                self.show_game_summary(player_name)
                return
            
            input(f"\n다음 턴으로 넘어갑니다. (Enter를 눌러 계속...)")
            
            # 플레이어 교체
            self.current_player = 2 if self.current_player == 1 else 1
            
            # 양쪽 플레이어가 모두 한 번씩 시도했을 때만 attempt 증가
            if self.current_player == 1:
                attempt += 1
        
        # 최대 시도 횟수 도달
        self.show_game_summary()
    
    def play_again(self) -> bool:
        """다시 플레이할지 묻습니다."""
        while True:
            choice = input(f"\n다시 플레이하시겠습니까? (y/n): ").strip().lower()
            if choice in ['y', 'yes', '예', 'ㅇ']:
                return True
            elif choice in ['n', 'no', '아니오', 'ㄴ']:
                return False
            else:
                print("y 또는 n을 입력해주세요.")


def main():
    """메인 함수"""
    print("🎯 숫자야구 멀티플레이어 게임에 오신 것을 환영합니다!")
    
    while True:
        game = BullsAndCowsGame()
        game.setup_game()
        game.play_game()
        
        if not game.play_again():
            break
    
    print(f"\n게임을 종료합니다. 즐거운 시간이었습니다! 👋")


if __name__ == "__main__":
    main()