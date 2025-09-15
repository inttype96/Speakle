from app.core.weaviateClient import get_client
import pandas as pd
from weaviate.classes.query import Filter
import numpy as np

# Song / LyricChunk 기본 현황 확인
def check_basic_stats():
    client = get_client()

    song_col = client.collections.get("Song")
    lyric_col = client.collections.get("LyricChunk")
    df_meta = pd.read_csv("data/clean_meta_en_with_popularity.csv")
    print("전체 곡 수:", len(df_meta))
    print("popularity ≥ 50 곡 수:", (df_meta["popularity"] >= 50).sum())

    song_count = song_col.aggregate.over_all(total_count=True).total_count
    lyric_count = lyric_col.aggregate.over_all(total_count=True).total_count

    print(f"🎵 Song 총 개수: {song_count:,}")
    print(f"📝 LyricChunk 총 개수: {lyric_count:,}")

    # 샘플 Song
    sample_songs = song_col.query.fetch_objects(limit=5).objects
    print("\n Song 샘플:")
    for s in sample_songs:
        print({k: s.properties.get(k) for k in ["song_id", "title", "artists", "popularity"]})

    # 샘플 LyricChunk
    sample_lyrics = lyric_col.query.fetch_objects(limit=5).objects
    print("\n LyricChunk 샘플:")
    for l in sample_lyrics:
        props = l.properties
        print({
            "song_id": props.get("song_id"),
            "chunk_idx": props.get("chunk_idx"),
            "words": (props.get("words") or "")[:50],
            "vector_dim": 0 if l.vector is None else len(l.vector)
        })

    client.close()


# ✅ 특정 단어("love") 기반 유사도 검색
def test_word_similarity(query_word="yours", n=5):
    
    client = get_client()
    lyric_col = client.collections.get("LyricChunk")

    # "love" 들어간 청크 중에서 벡터가 있는 것만 찾기
    objs = lyric_col.query.fetch_objects(
        filters=Filter.by_property("words").like(f"*{query_word}*"),
        limit=500  # 충분히 넉넉히 가져오기
    )

    # 벡터가 있는 것만 추리기
    objs_with_vec = [o for o in objs.objects if o.vector is not None and len(o.vector) > 0]

    if not objs_with_vec:
        print(f"'{query_word}' 단어 포함 + 벡터 보유 청크를 찾지 못했습니다.")
        print("➡️ 대신 텍스트 기반으로만 'love' 들어간 청크 샘플 보여줍니다.")
        for o in objs.objects[:10]:
            props = o.properties                                                  
            print({
                "song_id": props.get("song_id"),
                "chunk_idx": props.get("chunk_idx"),
                "words": (props.get("words") or "")[:80]
            })
        client.close()
        return

    # 하나 기준으로 벡터 유사도 검색 실행
    query_obj = objs_with_vec[0]
    query_text = query_obj.properties.get("words", "")
    vector = list(query_obj.vector)

    print(f"\n '{query_word}' 단어로 유사도 검색 시작")
    print(f" 기준 가사: {query_text[:80]}...")

    res = lyric_col.query.near_vector(vector, limit=n)

    print("\n 유사한 가사 청크 추천 결과:")
    for o in res.objects:
        props = o.properties
        print({
            "song_id": props.get("song_id"),
            "chunk_idx": props.get("chunk_idx"),
            "words": (props.get("words") or "")[:80]
        })

    client.close()

def check_vectors_for_popular_songs(limit=10):
    client = get_client()
    lyric_col = client.collections.get("LyricChunk")

    # ✅ include_vector 사용
    objs = lyric_col.query.fetch_objects(
        limit=limit,
        include_vector=True
    )

    print("===== 🎯 벡터 EDA (임베딩 확인) =====")
    for o in objs.objects:
        props = o.properties
        vector_dim = 0 if o.vector is None else len(o.vector)
        print({
            "song_id": props.get("song_id"),
            "chunk_idx": props.get("chunk_idx"),
            "words": (props.get("words") or "")[:80],
            "vector_dim": vector_dim
        })

    client.close()

from app.core.weaviateClient import get_client

def count_vectors_with_embeddings(sample_size=5000):
    client = get_client()
    lyric_col = client.collections.get("LyricChunk")

    # 넉넉히 샘플링해서 가져오기
    objs = lyric_col.query.fetch_objects(limit=sample_size, include_vector=True)

    # vector_dim > 0 인 개수 세기
    vec_count = sum(1 for o in objs.objects if o.vector is not None and len(o.vector) > 0)

    print("===== 📊 Vector EDA =====")
    print(f"샘플 {sample_size:,}개 중 벡터 있는 청크 개수: {vec_count:,}")
    print(f"비율: {vec_count/sample_size:.2%}")

    client.close()
   

# def check_vector_stats():
#     client = get_client()
#     lyric_col = client.collections.get("LyricChunk")

#     # 전체 개수
#     total_count = lyric_col.aggregate.over_all(total_count=True).total_count

#     # vector_dim > 0 인 개수 확인
#     objs = lyric_col.query.fetch_objects(
#         limit=50,
#         return_vector=True,
#     )

#     vector_counts = []
#     for o in objs.objects:
#         if o.vector is not None:
#             vector_counts.append(len(o.vector))
#         else:
#             vector_counts.append(0)

#     print("=====  Vector EDA =====")
#     print(f"총 LyricChunk 개수: {total_count:,}")
#     print(f"샘플 50개 vector dim: {vector_counts}")
#     print(f"vector_dim>0 인 샘플 개수: {sum(1 for d in vector_counts if d > 0)}")

#     client.close()


if __name__ == "__main__":
    print("=====  EDA 기본 확인 =====")
    check_basic_stats()

    print("\n===== 'yours' 단어 기반 추천 확인 =====")
    test_word_similarity("yours", n=5)
    check_vectors_for_popular_songs(limit=10)
    count_vectors_with_embeddings(sample_size=5000)
    # check_vector_stats()
