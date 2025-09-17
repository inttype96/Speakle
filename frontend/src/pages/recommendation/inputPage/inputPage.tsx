import React from 'react';
import Navbar from "@/components/common/navbar";
import FindMusic from "./components/findMusic";
import SituationListen from "./components/situationListen";
import WhereListen from "./components/whereListen";
import FavoriteGenre from "./components/favoriteGenre";
import StartButton from "./components/startButton";
import RecomTip from "./components/recomTip";

const InputPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-background">
        <Navbar />
      </div>
      <div className="min-h-screen max-w-6xl mx-auto px-4 py-8">
        <FindMusic />
        <SituationListen />
        <WhereListen />
        <FavoriteGenre />
        <StartButton />
        <RecomTip />
      </div>
    </div>
    
  );
};

export default InputPage;
