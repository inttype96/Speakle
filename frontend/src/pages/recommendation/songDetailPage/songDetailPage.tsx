import React from 'react';
import Navbar from "@/components/common/navbar";
import Education from "./components/education";
import Tap from "./components/tap";
import Lyrics from "./components/lyrics";

const SongDetailPage: React.FC = () => {
  return (
    <div>
      <div className="bg-background text-foreground">
          <Navbar />
      </div>
      <Education />
      <Tap />
      <Lyrics />
    </div>
      
  );
};

export default SongDetailPage;
