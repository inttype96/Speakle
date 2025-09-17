import React from 'react';
import { useNavigate } from 'react-router-dom';

const StartButton: React.FC = () => {
  const navigate = useNavigate();

  const handleStartClick = () => {
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
