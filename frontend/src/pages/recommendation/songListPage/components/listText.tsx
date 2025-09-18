import React from 'react';

const ListText: React.FC = () => {
  return (
    <div className="text-left py-8 p-4 mt-12 mb-4">
      <h1 className="text-4xl font-bold text-foreground mb-4">추천 곡 목록</h1>
      <p className="text-lg text-muted-foreground">
        당신의 취향에 맞는 곡들을 추천해드려요
      </p>
    </div>
  );
};

export default ListText;
