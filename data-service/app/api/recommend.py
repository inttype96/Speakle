# app/api/recommend.py
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from app.core.weaviateClient import get_client
from weaviate.classes.query import Filter
from transformers import AutoTokenizer, AutoModel
import torch
import numpy as np

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

# 입력 스키마
class QueryRequest(BaseModel):
    words: List[str]
    phrases: List[str]
    top_k: int = 50   # 최종 rerank 결과 수

# 출력 스키마
class Recommendation(BaseModel):
    song_id: str
    chunk_idx: int
    words: str
    score: float
    source: str   # "bm25+rerank"

class QueryResponse(BaseModel):
    results: List[Recommendation]

@router.post("/recommend", response_model=QueryResponse)
def recommend_songs(req: QueryRequest):
    client = get_client()
    lyric_col = client.collections.get("LyricChunk")

    queries = req.words + req.phrases
    all_results = []

    try:
        for q in queries:
            # BM25 후보 검색 (limit=50)
            bm25_res = lyric_col.query.fetch_objects(
                filters=Filter.by_property("words").like(f"*{q}*"),
                limit=50,
                include_vector=True
            )
            for o in bm25_res.objects:
                props = o.properties
                all_results.append({
                    "song_id": props.get("song_id"),
                    "chunk_idx": props.get("chunk_idx"),
                    "words": props.get("words"),
                    "vector": o.vector,  # rerank용
                })

        # 중복 제거 (words 텍스트 기준)
        seen = {}
        for r in all_results:
            key = r["words"].strip().lower() if r["words"] else ""
            if key not in seen:
                seen[key] = r
        unique_results = list(seen.values())
    
        # Rerank (쿼리 임베딩 vs 후보 벡터)
        reranked = []
        for q in queries:
            query_vec = embed_text_qwen(q)
            for r in unique_results:
                cand_vec = extract_vector(r["vector"])
                if cand_vec is None or len(cand_vec) != len(query_vec):
                    continue
                sim = float(np.dot(query_vec, cand_vec) / (np.linalg.norm(cand_vec) + 1e-10))
                reranked.append({
                    "song_id": r["song_id"],
                    "chunk_idx": r["chunk_idx"],
                    "words": r["words"],
                    "score": sim,
                    "source": "bm25+rerank"
                })

        # Top-K 반환
        final_results = sorted(reranked, key=lambda x: x["score"], reverse=True)[:req.top_k]
        return {"results": final_results}

    finally:
        client.close()
