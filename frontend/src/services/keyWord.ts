// src/services/recommend.ts
// ──────────────────────────────────────────────────────────────────────────────
// [역할]
// - 음악 추천 관련 API 호출 래퍼
// - USE_MOCK = true 일 때는 네트워크 없이 목업 데이터로 동작
// - 실제 API 붙일 땐 USE_MOCK = false 로 변경
// ──────────────────────────────────────────────────────────────────────────────

import { http } from "./http"; // 공용 axios 인스턴스 (baseURL, interceptors 등)
import type {
    RecommendHybridReq,
    RecommendHybridRes,
    RecommendLevelReq,
    RecommendLevelRes,
    RecommendRandomReq,
    RecommendRandomRes,
} from "@/types/keyWord";

// 실제 API 연결 전까지는 목업으로 프론트만 돌릴 수 있게 플래그 제공
const USE_MOCK = false;

// ──────────────────────────────────────────────────────────────────────────────
// 목업 데이터 (추천 음악 예시)
// ──────────────────────────────────────────────────────────────────────────────
const MOCK_HYBRID_SONGS = [
    {
        songId: "1001",
        title: "Hello",
        artists: "Adele",
        albumName: "25",
        albumImgUrl: "https://example.com/hello.jpg",
        difficulty: "LOW" as const,
        durationMs: 295000,
        popularity: 85,
        recommendScore: 0.92,
        learnCount: 1250,
    },
    {
        songId: "1002",
        title: "Shape of You",
        artists: "Ed Sheeran",
        albumName: "÷ (Divide)",
        albumImgUrl: "https://example.com/shape-of-you.jpg",
        difficulty: "MEDIUM" as const,
        durationMs: 263000,
        popularity: 90,
        recommendScore: 0.88,
        learnCount: 2100,
    },
    {
        songId: "1003",
        title: "Anti-Hero",
        artists: "Taylor Swift",
        albumName: "Midnights",
        albumImgUrl: "https://example.com/anti-hero.jpg",
        difficulty: "HIGH" as const,
        durationMs: 201000,
        popularity: 88,
        recommendScore: 0.95,
        learnCount: 1800,
    },
    {
        songId: "1004",
        title: "Blinding Lights",
        artists: "The Weeknd",
        albumName: "After Hours",
        albumImgUrl: "https://example.com/blinding-lights.jpg",
        difficulty: "MEDIUM" as const,
        durationMs: 200000,
        popularity: 92,
        recommendScore: 0.89,
        learnCount: 1650,
    },
    {
        songId: "1005",
        title: "Watermelon Sugar",
        artists: "Harry Styles",
        albumName: "Fine Line",
        albumImgUrl: "https://example.com/watermelon-sugar.jpg",
        difficulty: "LOW" as const,
        durationMs: 174000,
        popularity: 87,
        recommendScore: 0.85,
        learnCount: 1400,
    },
];

const MOCK_LEVEL_SONGS: RecommendLevelRes[] = [
    {
        songId: 2001,
        title: "Hello",
        artists: ["Adele"],
        albumImgUrl: "https://example.com/hello.jpg",
    },
    {
        songId: 2002,
        title: "Shape of You",
        artists: ["Ed Sheeran"],
        albumImgUrl: "https://example.com/shape-of-you.jpg",
    },
    {
        songId: 2003,
        title: "Anti-Hero",
        artists: ["Taylor Swift"],
        albumImgUrl: "https://example.com/anti-hero.jpg",
    },
];

const MOCK_RANDOM_SONGS: RecommendRandomRes[] = [
    {
        songId: 3001,
        title: "Blinding Lights",
        artists: ["The Weeknd"],
        albumImgUrl: "https://example.com/blinding-lights.jpg",
    },
    {
        songId: 3002,
        title: "Watermelon Sugar",
        artists: ["Harry Styles"],
        albumImgUrl: "https://example.com/watermelon-sugar.jpg",
    },
    {
        songId: 3003,
        title: "Heat Waves",
        artists: ["Glass Animals"],
        albumImgUrl: "https://example.com/heat-waves.jpg",
    },
];

// ──────────────────────────────────────────────────────────────────────────────
// 1) 하이브리드 추천 (상황 + 장소 기반)
// - 사용자의 상황, 장소를 종합적으로 고려한 추천
// - 상세한 곡 정보와 LLM이 분석한 키워드, 관용구를 포함하여 반환
// - difficulty, popularity, recommendScore, learnCount 등 상세 정보 포함
// ──────────────────────────────────────────────────────────────────────────────
export async function getHybridRecommendation(req: RecommendHybridReq): Promise<RecommendHybridRes> {
    if (USE_MOCK) {
        // 목업 데이터: 상세한 곡 정보와 키워드 반환
        const limitedSongs = MOCK_HYBRID_SONGS.slice(0, req.limit);
        
        return {
            recommendedSongs: limitedSongs,
            keywords: {
                words: ["emotion", "relationship", "self-reflection", "love", "life"],
                phrases: ["get older", "the problem", "as it was", "shape of you", "heat waves"],
            },
            totalCount: MOCK_HYBRID_SONGS.length,
        };
    }

    // 실제 API 호출
    const res = await http.post<RecommendHybridRes>(
        "/recommend/hybrid/enhanced",
        {
            situation: req.situation,
            location: req.location,
            limit: req.limit,
        },
        { headers: { "Content-Type": "application/json" } }
    );
    return res.data;
}

// ──────────────────────────────────────────────────────────────────────────────
// 2) 레벨 기반 추천 (사용자 영어 실력에 따른 추천)
// - 초급, 중급, 고급 등 사용자의 영어 레벨에 맞는 곡 추천
// - 곡의 상세 정보(제목, 아티스트, 앨범 이미지)를 포함하여 반환
// ──────────────────────────────────────────────────────────────────────────────
export async function getLevelRecommendation(req: RecommendLevelReq): Promise<RecommendLevelRes[]> {
    if (USE_MOCK) {
        // 목업 데이터 반환 (limit 없음)
        return MOCK_LEVEL_SONGS;
    }

    // 실제 API 호출
    const res = await http.post<RecommendLevelRes[]>(
        "/recommend/level",
        {
            level: req.level,
        },
        { headers: { "Content-Type": "application/json" } }
    );
    return res.data;
}

// ──────────────────────────────────────────────────────────────────────────────
// 3) 랜덤 추천 (무작위 곡 추천)
// - 사용자 선호도나 상황과 관계없이 랜덤하게 곡을 추천
// - 새로운 음악 발견이나 다양한 장르 경험을 위한 기능
// - 곡의 상세 정보(제목, 아티스트, 앨범 이미지)를 포함하여 반환
// ──────────────────────────────────────────────────────────────────────────────
export async function getRandomRecommendation(_req: RecommendRandomReq = {}): Promise<RecommendRandomRes[]> {
    if (USE_MOCK) {
        // 랜덤하게 섞어서 반환 (실제로는 서버에서 랜덤 처리)
        const shuffledSongs = [...MOCK_RANDOM_SONGS].sort(() => Math.random() - 0.5);
        
        return shuffledSongs;
    }

    // 실제 API 호출 (GET 요청으로 랜덤 추천)
    const res = await http.get<RecommendRandomRes[]>("/recommend/random");
    return res.data;
}