import React, { useState } from 'react';
import Navbar from "@/components/common/navbar";
import FindMusic from "./components/findMusic";
import SituationListen from "./components/situationListen";
import WhereListen from "./components/whereListen";
import StartButton from "./components/startButton";
import RecomTip from "./components/recomTip";

// 사용자 입력 데이터를 관리하기 위한 타입 정의
interface UserInputData {
  situation: string;  // 선택된 상황 (예: "morning", "exercise" 등)
  location: string;   // 선택된 장소 (예: "home", "car" 등)
}

const InputPage: React.FC = () => {
  // 사용자가 선택한 상황과 장소를 상태로 관리
  const [userInput, setUserInput] = useState<UserInputData>({
    situation: '',  // 초기값은 빈 문자열
    location: ''    // 초기값은 빈 문자열
  });

  // 상황 선택 핸들러 - SituationListen 컴포넌트에서 호출될 함수
  const handleSituationChange = (situation: string) => {
    setUserInput(prev => ({
      ...prev,
      situation: situation  // 선택된 상황을 상태에 저장
    }));
  };

  // 장소 선택 핸들러 - WhereListen 컴포넌트에서 호출될 함수
  const handleLocationChange = (location: string) => {
    setUserInput(prev => ({
      ...prev,
      location: location  // 선택된 장소를 상태에 저장
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-background">
        <Navbar />
      </div>
      <div className="min-h-screen max-w-6xl mx-auto px-4 py-8">
        <FindMusic />
        {/* 상황 선택 컴포넌트에 선택 핸들러와 현재 선택된 값 전달 */}
        <SituationListen 
          onSituationChange={handleSituationChange}
          selectedSituation={userInput.situation}
        />
        {/* 장소 선택 컴포넌트에 선택 핸들러와 현재 선택된 값 전달 */}
        <WhereListen 
          onLocationChange={handleLocationChange}
          selectedLocation={userInput.location}
        />
        {/* 시작 버튼에 현재 입력된 데이터 전달 */}
        <StartButton userInput={userInput} />
        <RecomTip />
      </div>
    </div>
    
  );
};

export default InputPage;
