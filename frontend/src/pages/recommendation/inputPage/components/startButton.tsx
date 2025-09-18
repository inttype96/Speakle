import React from 'react';
import { useNavigate } from 'react-router-dom';

// 상위 컴포넌트로부터 받을 props 타입 정의
interface StartButtonProps {
  userInput: {
    situation: string;  // 선택된 상황
    location: string;   // 선택된 장소
  };
}

const StartButton: React.FC<StartButtonProps> = ({ userInput }) => {
  const navigate = useNavigate();

  const handleStartClick = () => {
    // 선택된 데이터를 확인하고 다음 페이지로 이동
    console.log('선택된 데이터:', userInput);  // 디버깅용 로그
    navigate('/songlist');
  };

  return (
    <div className="text-center mb-12">
      <button 
        onClick={handleStartClick}
        className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 px-12 rounded-lg text-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
      >
        추천 받고 영어 학습 시작하기
      </button>
    </div>
  );
};

export default StartButton;
