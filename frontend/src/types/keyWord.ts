export type RecommendHybridReq = {
    situation: string;
    location: string;    
    // genre: string; // 요청 x       
    limit: 50; // 50 고정 
  };

  export type RecommendHybridRes = {
    recommendedSongs: {
      songId: string;
      title: string;
      artists: string;
      albumName: string;
      albumImgUrl: string;
      difficulty: "LOW" | "MEDIUM" | "HIGH";
      durationMs: number;
      popularity: number;
      recommendScore: number;
      learnCount: number;
    }[];
    keywords: {
      words: string[];
      phrases: string[];
    };
    totalCount: number;
  };

  export type RecommendLevelReq = {
    level: string;
    // limit: number; // 요청 x 
  };

  export type RecommendLevelRes = {
    songId: number;
    title: string;
    artists: string[];
    albumImgUrl: string;
  };

  export type RecommendRandomReq = {
    
  };

  export type RecommendRandomRes = {
    songId: number;
    title: string;
    artists: string[];
    albumImgUrl: string;
  };