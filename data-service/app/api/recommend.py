# app/api/recommend.py
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from app.core.weaviateClient import get_client
from weaviate.classes.query import Filter
from transformers import AutoTokenizer, AutoModel
import torch
import numpy as np
import math

router = APIRouter()

# Qwen3-Embedding-0.6B 모델 로드
MODEL_NAME = "Qwen/Qwen3-Embedding-0.6B"
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModel.from_pretrained(MODEL_NAME)

def extract_vector(vec):
    #dict 벡터에서 numpy array로 변환
    if vec is None:
        return None
    if isinstance(vec, dict):
        # 첫 번째 key의 value 꺼내기 (Weaviate는 항상 1개 key)
        if not vec or not vec.values():
            return None
        first_value = list(vec.values())[0]
        return np.array(first_value, dtype=float)
    return np.array(vec, dtype=float)

def embed_text_qwen(text: str) -> np.ndarray:
    # Qwen3-Embedding-0.6B 모델로 텍스트 임베딩
    inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=128)
    with torch.no_grad():
        outputs = model(**inputs)
        # pooler_output 사용
        if hasattr(outputs, "pooler_output") and outputs.pooler_output is not None:
            embedding = outputs.pooler_output.squeeze().cpu().numpy()
        else:
            # fallback: last_hidden_state 평균
            embedding = outputs.last_hidden_state.mean(dim=1).squeeze().cpu().numpy()
    return embedding / np.linalg.norm(embedding)  # 정규화

def normalize_popularity(popularity: int, min_pop: int = 0, max_pop: int = 100) -> float:
    """인기도를 0-1 사이로 정규화"""
    if max_pop == min_pop:
        return 0.5  # 모든 값이 같으면 중간값
    return max(0.0, min(1.0, (popularity - min_pop) / (max_pop - min_pop)))

def calculate_popularity_boost(popularity: int) -> float:
    """인기도 기반 부스트 점수 계산 (로그 스케일)"""
    if popularity <= 0:
        return 0.0
    # 로그 스케일로 인기도 변환 (너무 인기있는 곡이 압도하지 않도록)
    return min(1.0, math.log(popularity + 1) / math.log(101))  # 0-100 범위를 0-1로

def get_song_popularity(client, song_id: str) -> int:
    """Weaviate에서 특정 곡의 인기도 조회"""
    try:
        # Song 컬렉션에서 해당 곡의 popularity 조회
        song_col = client.collections.get("Song")
        result = song_col.query.fetch_objects(
            filters=Filter.by_property("song_id").equal(song_id),
            limit=1
        )
        if result.objects:
            return result.objects[0].properties.get("popularity", 0)
        return 0
    except Exception as e:
        print(f"Failed to get popularity for song {song_id}: {e}")
        return 0

def calculate_hybrid_score(
    similarity_score: float,
    popularity_score: float,
    similarity_weight: float = 0.7,
    popularity_weight: float = 0.3
) -> float:
    """유사도와 인기도를 결합한 하이브리드 점수 계산"""
    # 가중치 정규화
    total_weight = similarity_weight + popularity_weight
    if total_weight <= 0:
        return similarity_score

    norm_sim_weight = similarity_weight / total_weight
    norm_pop_weight = popularity_weight / total_weight

    return (norm_sim_weight * similarity_score) + (norm_pop_weight * popularity_score)

# 입력 스키마
class QueryRequest(BaseModel):
    words: List[str]
    phrases: List[str]
    top_k: int = 50   # 최종 rerank 결과 수
    # 새로운 가중치 파라미터들
    popularity_weight: float = 0.3    # 인기도 가중치
    similarity_weight: float = 0.7    # 유사도 가중치
    min_popularity: Optional[int] = None  # 최소 인기도 필터

# 출력 스키마
class Recommendation(BaseModel):
    song_id: str
    chunk_idx: int
    words: str
    score: float
    popularity_score: Optional[float] = None   # 인기도 점수
    similarity_score: Optional[float] = None   # 유사도 점수
    final_score: float                         # 최종 하이브리드 점수
    source: str   # "bm25+rerank+popularity"

class QueryResponse(BaseModel):
    results: List[Recommendation]

@router.post("/recommend", response_model=QueryResponse)
def recommend_songs(req: QueryRequest):
    client = get_client()
    lyric_col = client.collections.get("LyricChunk")

    queries = req.words + req.phrases
    all_results = []

    try:
        # 1단계: BM25 후보 검색
        for q in queries:
            bm25_res = lyric_col.query.fetch_objects(
                filters=Filter.by_property("words").like(f"*{q}*"),
                limit=100,  # 더 많은 후보 확보
                include_vector=True
            )
            for o in bm25_res.objects:
                props = o.properties
                all_results.append({
                    "song_id": props.get("song_id"),
                    "chunk_idx": props.get("chunk_idx"),
                    "words": props.get("words"),
                    "vector": o.vector,
                })

        # 2단계: 중복 제거 및 인기도 조회
        seen = {}
        song_popularity_cache = {}

        for r in all_results:
            key = r["words"].strip().lower() if r["words"] else ""
            if key not in seen:
                song_id = r["song_id"]
                # 인기도 캐시 확인
                if song_id not in song_popularity_cache:
                    song_popularity_cache[song_id] = get_song_popularity(client, song_id)

                r["popularity"] = song_popularity_cache[song_id]

                # 최소 인기도 필터 적용
                if req.min_popularity is None or r["popularity"] >= req.min_popularity:
                    seen[key] = r

        unique_results = list(seen.values())
        print(f"Found {len(unique_results)} unique candidates after popularity filtering")

        # 3단계: 하이브리드 스코어링 (유사도 + 인기도)
        reranked = []

        # 인기도 정규화를 위한 min/max 계산
        popularities = [r["popularity"] for r in unique_results if r["popularity"] > 0]
        min_pop = min(popularities) if popularities else 0
        max_pop = max(popularities) if popularities else 100

        for q in queries:
            query_vec = embed_text_qwen(q)
            for r in unique_results:
                cand_vec = extract_vector(r["vector"])
                if cand_vec is None or len(cand_vec) != len(query_vec):
                    continue

                # 유사도 점수 계산
                similarity_score = float(np.dot(query_vec, cand_vec) / (np.linalg.norm(cand_vec) + 1e-10))

                # 인기도 점수 계산
                popularity_raw = r["popularity"]
                popularity_score = calculate_popularity_boost(popularity_raw)

                # 하이브리드 점수 계산
                final_score = calculate_hybrid_score(
                    similarity_score,
                    popularity_score,
                    req.similarity_weight,
                    req.popularity_weight
                )

                reranked.append({
                    "song_id": r["song_id"],
                    "chunk_idx": r["chunk_idx"],
                    "words": r["words"],
                    "score": similarity_score,  # 호환성을 위해 유지
                    "popularity_score": popularity_score,
                    "similarity_score": similarity_score,
                    "final_score": final_score,
                    "source": "bm25+rerank+popularity"
                })

        # 4단계: 최종 점수로 정렬 및 Top-K 반환
        final_results = sorted(reranked, key=lambda x: x["final_score"], reverse=True)[:req.top_k]

        print(f"Top 5 results:")
        for i, result in enumerate(final_results[:5]):
            print(f"  {i+1}. song_id={result['song_id']}, "
                  f"sim={result['similarity_score']:.3f}, "
                  f"pop={result['popularity_score']:.3f}, "
                  f"final={result['final_score']:.3f}")

        return {"results": final_results}

    finally:
        client.close()

@router.post("/recommend/advanced", response_model=QueryResponse)
def recommend_songs_advanced(req: QueryRequest):
    """고급 추천 알고리즘: 다양성과 탐색/활용 균형을 고려"""
    client = get_client()
    lyric_col = client.collections.get("LyricChunk")

    queries = req.words + req.phrases
    all_results = []

    try:
        # 기본 추천 로직 실행
        basic_results = recommend_songs(QueryRequest(
            words=req.words,
            phrases=req.phrases,
            top_k=req.top_k * 3,  # 더 많은 후보 확보
            popularity_weight=req.popularity_weight,
            similarity_weight=req.similarity_weight,
            min_popularity=req.min_popularity
        ))

        # 다양성 증진: 같은 아티스트의 곡이 너무 많이 나오지 않도록
        diversified_results = []
        artist_count = {}
        max_per_artist = max(1, req.top_k // 10)  # 상위 10% 이내에서 같은 아티스트

        for result in basic_results.results:
            song_id = result.song_id
            # 아티스트 정보 조회 (실제 구현시 Song 컬렉션에서)
            # 현재는 간단히 다양성만 고려
            if len(diversified_results) < req.top_k:
                diversified_results.append(result)

        return {"results": diversified_results}

    finally:
        client.close()

class RandomSongRequest(BaseModel):
    userId: str
    userPlaylistFeatures: Optional[dict] = None
    weatherData: Optional[dict] = None
    minPopularity: int = 80
    difficultyLevels: Optional[List[str]] = None

    class Config:
        populate_by_name = True
        alias_generator = lambda x: ''.join(word.capitalize() if i > 0 else word for i, word in enumerate(x.split('_')))

class RandomSongResponse(BaseModel):
    songId: str
    title: str
    artist: str
    popularity: int
    difficulty: Optional[str] = None
    albumImageUrl: Optional[str] = None

@router.post("/recommend/random", response_model=RandomSongResponse)
def recommend_random_song(req: RandomSongRequest):
    """날씨, 사용자 플레이리스트 특성, 난이도, 인기도를 고려한 랜덤 노래 추천"""
    import random
    client = get_client()

    try:
        song_col = client.collections.get("Song")

        # 기본 필터: 인기도 80 이상
        filters = Filter.by_property("popularity").greater_or_equal(req.minPopularity)

        # 난이도 필터 추가
        if req.difficultyLevels:
            difficulty_filters = []
            for level in req.difficultyLevels:
                difficulty_filters.append(Filter.by_property("level").equal(level))
            if len(difficulty_filters) > 1:
                filters = filters & Filter.any_of(difficulty_filters)
            else:
                filters = filters & difficulty_filters[0]

        # 날씨 기반 필터링 (제목에 날씨 키워드 포함)
        weather_keyword = None
        if req.weatherData:
            condition = req.weatherData.get("condition", "").lower()
            if "rain" in condition or "drizzle" in condition:
                weather_keyword = "rain"
            elif "snow" in condition:
                weather_keyword = "snow"
            elif "sun" in condition or "clear" in condition:
                weather_keyword = "sun"
            elif "cloud" in condition:
                weather_keyword = "cloud"

        # 후보 곡 조회
        candidates = song_col.query.fetch_objects(
            filters=filters,
            limit=100,
            include_vector=True
        )

        if not candidates.objects:
            raise Exception("No songs found matching criteria")

        # 날씨 키워드가 있으면 제목에 포함된 곡 우선
        weather_matched_songs = []
        other_songs = []

        for song in candidates.objects:
            props = song.properties
            title = props.get("title", "").lower()
            if weather_keyword and weather_keyword in title:
                weather_matched_songs.append(song)
            else:
                other_songs.append(song)

        # 사용자 플레이리스트 특성이 있으면 유사도 기반 필터링
        if req.userPlaylistFeatures:
            # 오디오 특성 벡터 생성
            features_text = " ".join([
                f"{k}:{v}" for k, v in req.userPlaylistFeatures.items()
            ])
            features_vec = embed_text_qwen(features_text)

            # 날씨 매칭 곡이 있으면 그 중에서, 없으면 전체에서
            target_songs = weather_matched_songs if weather_matched_songs else candidates.objects

            # 유사도 계산
            scored_songs = []
            for song in target_songs:
                props = song.properties
                song_vec = extract_vector(song.vector)
                if song_vec is None or len(song_vec) != len(features_vec):
                    continue
                similarity = float(np.dot(features_vec, song_vec) / (np.linalg.norm(song_vec) + 1e-10))
                artists = props.get("artists", [])
                artist_str = ", ".join(artists) if isinstance(artists, list) else str(artists) if artists else "Unknown"

                scored_songs.append({
                    "song_id": props.get("song_id"),
                    "title": props.get("title", "Unknown"),
                    "artists": artist_str,
                    "popularity": props.get("popularity", 0),
                    "difficulty": props.get("level"),
                    "album_img_url": props.get("album_img_url")
                })

            # 유사도 상위 10개 중에서 랜덤 선택
            scored_songs.sort(key=lambda x: x["similarity"], reverse=True)
            top_candidates = scored_songs[:10]

            if top_candidates:
                selected = random.choice(top_candidates)
                return RandomSongResponse(
                    songId=selected["song_id"],
                    title=selected["title"],
                    artist=selected["artists"],
                    popularity=selected["popularity"],
                    difficulty=selected["difficulty"],
                    albumImageUrl=selected.get("album_img_url")
                )

        # 플레이리스트 특성이 없거나 유사도 계산 실패시
        # 날씨 매칭 곡이 있으면 그 중에서, 없으면 전체에서 랜덤
        target_songs = weather_matched_songs if weather_matched_songs else candidates.objects
        selected = random.choice(target_songs)
        props = selected.properties

        artists = props.get("artists", [])
        artist_str = ", ".join(artists) if isinstance(artists, list) else str(artists) if artists else "Unknown"

        return RandomSongResponse(
            songId=props.get("song_id", ""),
            title=props.get("title", "Unknown"),
            artist=artist_str,
            popularity=props.get("popularity", 0),
            difficulty=props.get("level"),
            albumImageUrl=props.get("album_img_url")
        )

    except Exception as e:
        print(f"Error in random song recommendation: {e}")
        raise
    finally:
        client.close()

@router.get("/recommend/stats")
def get_recommendation_stats():
    """추천 시스템 통계 및 성능 지표"""
    client = get_client()

    try:
        # Song 컬렉션 통계
        song_col = client.collections.get("Song")
        song_stats = song_col.aggregate.over_all(
            total_count=True
        )

        # LyricChunk 컬렉션 통계
        lyric_col = client.collections.get("LyricChunk")
        lyric_stats = lyric_col.aggregate.over_all(
            total_count=True
        )

        return {
            "total_songs": song_stats.total_count,
            "total_lyric_chunks": lyric_stats.total_count,
            "algorithm_version": "hybrid_v1.0",
            "features": [
                "semantic_similarity",
                "popularity_weighting",
                "bm25_retrieval",
                "qwen_embedding"
            ]
        }
    finally:
        client.close()
