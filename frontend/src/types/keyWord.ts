export type RecommendHybridReq = {
    situation: string;
    location: string;    
    genre: string;      
    limit: number;
  };

  export type RecommendHybridRes = {
    songIds: string[];
    keywords: {
      words: string[];
      phrases: string[];
      top_k: number;
    };
  };

  export type RecommendLevelReq = {
    level: string;
    limit: number;
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