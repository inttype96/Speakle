import React, { useState } from 'react';

const FavoriteGenre: React.FC = () => {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const genres = [
    'Pop', 'K-Pop', 'Rock', 'Hip-Hop', 'R&B', 
    'Electronic', 'Indie', 'Ballad', 'Jazz', 'Country'
  ];

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  return (
    <div className="mb-12">
      <h3 className="text-2xl font-bold text-foreground mb-6">선호하는 장르를 선택해주세요</h3>
      <div className="flex flex-wrap gap-3 justify-center">
        {genres.map((genre) => (
          <button
            key={genre}
            onClick={() => toggleGenre(genre)}
            className={`px-6 py-3 rounded-full border-2 transition-all duration-200 ${
              selectedGenres.includes(genre)
                ? 'border-primary bg-primary text-primary-foreground shadow-md'
                : 'border-border bg-card text-card-foreground hover:border-primary/30 hover:bg-muted/50'
            }`}
          >
            {genre}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FavoriteGenre;
