import React from 'react';
import Navbar from "@/components/common/navbar"
import ListText from "./components/listText"
import ResultList from "./components/resultList"
import FilterList from "./components/filterList"

const RecommendationPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-background">
        <Navbar />
      </div>
       <div className="min-h-screen max-w-6xl mx-auto px-4 py-8">
          <ListText />
          <ResultList />
          <FilterList />  
      </div>
    </div>
    
  );
};

export default RecommendationPage;
