import pandas as pd
import numpy as np
from datetime import datetime
from app.core.weaviateClient import get_client

def ingest_embeddings(
    parquet_files,
    meta_path="data/clean_meta_en_with_popularity.csv",
    lyrics_path="data/songs_with_lyrics_and_timestamps_filtered3.csv",
    max_per_song=50
):
    client = get_client()

    # popularity ≥ 50 필터링
    df_meta = pd.read_csv(meta_path)
    df_meta = df_meta[df_meta["popularity"].notna() & (df_meta["popularity"] >= 50)]
    valid_song_ids = set(df_meta["id"].unique())
    print(f"🎵 유효 곡 개수: {len(valid_song_ids):,}")

    # 가사 데이터 로드 + chunk_idx 확인
    df_lyrics = pd.read_csv(lyrics_path)
    df_lyrics = df_lyrics[df_lyrics["id"].isin(valid_song_ids)].reset_index(drop=True)

    # 이미 preprocessing 단계에서 chunk_idx가 생성돼 있으므로 여기서는 재계산하지 않음
    if "chunk_idx" not in df_lyrics.columns:
        df_lyrics["chunk_idx"] = df_lyrics.groupby("id").cumcount()

    for pq in parquet_files:
        print(f"\n Processing {pq}")
        df_embeddings = pd.read_parquet(pq)
        df_embeddings = df_embeddings[df_embeddings["id"].isin(valid_song_ids)]

        # 병합 (id + startTimeMs 기준)
        if "startTimeMs" in df_embeddings.columns and "startTimeMs" in df_lyrics.columns:
            df_joined = pd.merge(
                df_embeddings, df_lyrics,
                on=["id", "startTimeMs"],
                how="inner"
            )
        else:
            raise KeyError("'startTimeMs' 컬럼이 embeddings 또는 lyrics 데이터에 없습니다.")

        # 곡당 50개 균등 샘플링
        df_sampled = (
            df_joined.groupby("id", group_keys=False)
            .apply(lambda x: x.iloc[np.linspace(0, len(x)-1, min(max_per_song, len(x))).astype(int)])
        ).reset_index(drop=True)

        print(f"샘플링 완료: {len(df_sampled):,} rows (from {len(df_joined):,})")

        # Weaviate ingestion
        with client.batch.dynamic() as batch:
            for _, row in df_sampled.iterrows():
                lyric_id = f"{row['id']}_{row['startTimeMs']}"
                lyric_obj = {
                    "lyric_id": lyric_id,
                    "song_id": row["id"],
                    "chunk_idx": int(row["chunk_idx"]),
                    "start_ms": int(row["startTimeMs"]),
                    "words": str(row.get("words", "")),
                    "created_at": datetime.utcnow().replace(microsecond=0).isoformat() + "Z"
                }

                # 벡터 1024차원 안전하게 변환
                vector = row.loc[[f"vector_{i}" for i in range(1024)]].to_numpy(dtype=float).reshape(-1).tolist()

                batch.add_object(
                    collection="LyricChunk",
                    properties=lyric_obj,
                    vector=vector
                )

        print(f" {pq} ingestion 완료")

    client.close()


if __name__ == "__main__":
    parquet_files = [
        f"data/song_embeddings_with_timestamps_{str(i).zfill(2)}.parquet"
        for i in range(1, 17)
    ]
    ingest_embeddings(parquet_files)
