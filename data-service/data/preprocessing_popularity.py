import pandas as pd

# 파일 불러오기
df_meta = pd.read_csv("data/clean_meta_en.csv")
df_dataset = pd.read_csv("data/dataset.csv")

print("meta columns:", df_meta.columns)
print("dataset columns:", df_dataset.columns)

# id <-> track_id 기준으로 merge
df_merged = pd.merge(
    df_meta,
    df_dataset[["track_id", "popularity"]],
    left_on="id",
    right_on="track_id",
    how="left"
)

# track_id는 필요 없으니 drop
df_merged = df_merged.drop(columns=["track_id"])

# popularity 조건 적용 (50 미만은 NaN)
df_merged["popularity"] = df_merged["popularity"].apply(
    lambda x: x if pd.notnull(x) and x >= 50 else pd.NA
)

print("✅ popularity 병합 완료")
print(df_merged[["id", "name", "artists", "popularity"]].head(20))

# 저장
df_merged.to_csv("data/clean_meta_en_with_popularity.csv", index=False)
print("💾 저장 완료: data/clean_meta_en_with_popularity.csv")
