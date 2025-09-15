import pandas as pd

# 파일 로드
meta = pd.read_csv("data/songs_with_attributes_and_lyrics.csv")
engmeta = pd.read_csv("data/clean_meta_en_with_popularity.csv")

print("meta columns:", meta.columns)
print("dataset columns:", engmeta.columns)

# id, track_id 개수 확인
print("meta id count:", meta["id"].nunique())
print("meta id count:", engmeta["id"].nunique())

# 데이터 삭제할 부분 확인
print("Instrumental >= 0.8:", (meta["instrumentalness"] >= 0.8).mean())
print("liveness >= 0.8:", (meta["liveness"] >= 0.8).mean())
print("Instrumental >= 0.8:", (cleanmeta["instrumentalness"] >= 0.8).mean())
print(engmeta.loc[engmeta["instrumentalness"] <= 0.0, ["name", "artists"]].head(20))
print("liveness >= 0.8:", (cleanmeta["liveness"] >= 0.8).mean())
print("liveness >= 0.8:", (engmeta["liveness"] >= 0.8).mean())
print(engmeta[meta["instrumentalness"] >= 0.8].head(20))

to_drop = engmeta[
    (engmeta["instrumentalness"] == 0) &
    (engmeta["speechiness"] >= 0.7)
]

print("삭제 대상 샘플:")
print(to_drop[["name", "artists", "speechiness"]].head(20))

# 제거 후 남기기
engmeta = engmeta.drop(to_drop.index).reset_index(drop=True)

print("✅ 대본/낭독 데이터 제거 완료")
print("남은 곡 개수:", len(engmeta))

# ===============================
# ✅ Lyrics & Embeddings 컬럼 확인
# ===============================
df_lyrics = pd.read_csv("data/songs_with_lyrics_and_timestamps.csv")
df_embeddings = pd.read_parquet("data/song_embeddings_with_timestamps_01.parquet")

print("Lyrics CSV Columns:", df_lyrics.columns)
print("Parquet Columns:", df_embeddings.columns[:20])
