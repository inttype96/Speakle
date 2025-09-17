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
} from "@/types/recommend";

// 실제 API 연결 전까지는 목업으로 프론트만 돌릴 수 있게 플래그 제공
const USE_MOCK = false;

// ──────────────────────────────────────────────────────────────────────────────
// 목업 데이터 (추천 음악 예시)
// ──────────────────────────────────────────────────────────────────────────────
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
// 1) 하이브리드 추천 (상황 + 장소 + 장르 기반)
// - 사용자의 상황, 장소, 선호 장르를 종합적으로 고려한 추천
// - LLM이 분석한 키워드와 관용구를 포함한 songIds와 keywords 반환
// - 실제 곡 정보는 별도 API로 조회해야 함
// ──────────────────────────────────────────────────────────────────────────────
export async function getHybridRecommendation(req: RecommendHybridReq): Promise<RecommendHybridRes> {
    if (USE_MOCK) {
        // 목업 데이터: songIds와 keywords만 반환
        const mockSongIds = ["1001", "1002", "1003", "1004", "1005"];
        const limitedSongIds = mockSongIds.slice(0, req.limit);
        
        return {
            songIds: limitedSongIds,
            keywords: {
                words: ["emotion", "relationship", "self-reflection", "love", "life"],
                phrases: ["get older", "the problem", "as it was", "shape of you", "heat waves"],
                top_k: 5,
            },
        };
    }

    // 실제 API 호출
    const res = await http.post<RecommendHybridRes>(
        "/recommend/hybrid",
        {
            situation: req.situation,
            location: req.location,
            genre: req.genre,
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
        // 요청된 limit만큼 목업 데이터 반환
        const limitedSongs = MOCK_LEVEL_SONGS.slice(0, req.limit);
        
        return limitedSongs;
    }

    // 실제 API 호출
    const res = await http.post<RecommendLevelRes[]>(
        "/recommend/level",
        {
            level: req.level,
            limit: req.limit,
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
export async function getRandomRecommendation(req: RecommendRandomReq = {}): Promise<RecommendRandomRes[]> {
    if (USE_MOCK) {
        // 랜덤하게 섞어서 반환 (실제로는 서버에서 랜덤 처리)
        const shuffledSongs = [...MOCK_RANDOM_SONGS].sort(() => Math.random() - 0.5);
        
        return shuffledSongs;
    }

    // 실제 API 호출 (GET 요청으로 랜덤 추천)
    const res = await http.get<RecommendRandomRes[]>("/recommend/random");
    return res.data;
}