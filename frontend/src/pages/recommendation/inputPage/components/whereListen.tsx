import React, { useState } from 'react';

const WhereListen: React.FC = () => {
  const [selectedPlaces, setSelectedPlaces] = useState<string[]>([]);

  const places = [
    { id: 'home', label: '집', icon: '🏠' },
    { id: 'car', label: '차안', icon: '🚗' },
    { id: 'gym', label: '헬스장', icon: '💪' },
    { id: 'office', label: '사무실', icon: '🏢' },
    { id: 'cafe', label: '카페', icon: '☕' },
    { id: 'outdoor', label: '야외', icon: '🌳' },
    { id: 'transport', label: '대중교통', icon: '🚌' },
    { id: 'walk', label: '산책 중', icon: '🚶' }
  ];

  const togglePlace = (id: string) => {
    setSelectedPlaces(prev => 
      prev.includes(id) 
        ? prev.filter(p => p !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="mb-12">
      <h3 className="text-2xl font-bold text-foreground mb-6">어디에서 듣고 싶으신가요?</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {places.map((place) => (
          <button
            key={place.id}
            onClick={() => togglePlace(place.id)}
            className={`p-4 rounded-lg border-2 transition-all duration-200 ${
              selectedPlaces.includes(place.id)
                ? 'border-primary bg-primary/10 text-primary-foreground shadow-md'
                : 'border-border bg-card text-card-foreground hover:border-primary/30 hover:bg-muted/50'
            }`}
          >
            <div className="text-3xl mb-2">{place.icon}</div>
            <div className="text-sm font-medium">{place.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default WhereListen;
