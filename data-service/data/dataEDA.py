import pandas as pd

pd.set_option("display.max_colwidth", None)  # 문자열 자르지 않고 전부 출력


# ===============================
# 1. META 데이터 EDA
# ===============================
def inspect_meta(path: str):
    print(f"\n===== {path} (META) =====")
    df = pd.read_csv(path)

    # 기본 정보
    print("\n[Shape]")
    print(df.shape)

    print("\n[컬럼명]")
    print(df.columns.tolist())

    # 레벨 분포
    if "level" in df.columns:
        print("\n[레벨 분포]")
        print(df["level"].value_counts(dropna=False))

    # 앨범 이미지 URL 확인
    if "album_img_url" in df.columns:
        print("\n[album_img_url 결측치 개수]")
        print(df["album_img_url"].isna().sum())

        sample_with_img = df[df["album_img_url"].notna()].sample(5)
        print("\n[샘플 앨범 이미지]")
        print(sample_with_img[["name", "artists", "album_img_url"]])

    # 난이도별 샘플
    if "level" in df.columns:
        for lv in ["High", "Medium", "Low"]:
            print(f"\n[{lv} 난이도 샘플]")
            print(df[df["level"] == lv][["id", "name", "artists", "level", "album_img_url"]].head(5))

    # Adult 라벨 확인
    if "is_adult" in df.columns:
        print("\n[성인 라벨 통계]")
        print(df["is_adult"].value_counts())

    return df


# ===============================
# 2. LYRICS 데이터 EDA
# ===============================
def inspect_lyrics(path: str, meta_df: pd.DataFrame):
    print(f"\n===== {path} (LYRICS) =====")
    df = pd.read_csv(path)

    print("\n[Shape]")
    print(df.shape)

    print("\n[컬럼명]")
    print(df.columns.tolist())

    # 아티스트 예시
    target_artist = "Bruno Mars"
    artist_songs = meta_df[meta_df["artists"].str.contains(target_artist, case=False, na=False)]
    print(f"\n[{target_artist} 곡 리스트]")
    print(artist_songs[["id", "name", "artists", "popularity", "level"]].head(20))
    print(f"\n총 {target_artist} 곡 수: {len(artist_songs)}")

    return df


# ===============================
# 3. PARQUET (임베딩) EDA
# ===============================
def inspect_parquet(path: str, n: int = 5):
    print(f"\n===== {path} (PARQUET) =====")
    df = pd.read_parquet(path)

    # 기본 정보
    print("Shape:", df.shape)
    print("Columns:", df.columns.tolist())

    # Null 값 비율
    print("\nNull counts:")
    print(df.isna().sum())

    # 샘플
    print(f"\nSample {n} rows:")
    print(df.head(n))

    # 임베딩 길이 확인
    if "embedding" in df.columns:
        print("\nEmbedding vector length example:", len(df.iloc[0]["embedding"]))

    return df


# ===============================
# 실행부
# ===============================
if __name__ == "__main__":
    meta_path = "data/clean_meta_en_with_popularity_with_adult_pop50.csv"
    lyrics_path = "data/songs_with_lyrics_and_timestamps_clean.csv"
    parquet_path = "data/song_embeddings_with_timestamps_01.parquet"

    df_meta = inspect_meta(meta_path)
    df_lyrics = inspect_lyrics(lyrics_path, df_meta)
    df_parquet = inspect_parquet(parquet_path)
