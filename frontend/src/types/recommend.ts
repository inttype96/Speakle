export type RecommendHybridReq = {
    situation: string;
    location: string;    
    genre: string;      
    limit: number;
  };

  export type RecommendHybridRes = {
    status: number;
    message: string;
    data: [{
      songId: number;
      title: string;
      artists: string[];
      albumImgUrl: string;
      score: number;
      recommendationSentences: [{
        coreSentence: string;
        order: number;
      }];
    }];
    llm: {
      keywords: string[];
      idioms: string[];
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