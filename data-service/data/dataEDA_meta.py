import pandas as pd

pd.set_option("display.max_colwidth", None)  # 문자열 자르지 말고 전부 출력

# ✅ 파일 로드
df = pd.read_csv("data/clean_meta_en_with_popularity.csv")
df_lyric = pd.read_csv("data/songs_with_lyrics_and_timestamps_filtered2.csv")

print("===== clean_meta_en_with_popularity.csv EDA =====")

# 기본 정보
print("\n[Shape]")
print(df.shape)

print("\n[컬럼명]")
print(df.columns.tolist())

# 레벨 분포
print("\n[레벨 분포]")
print(df["level"].value_counts(dropna=False))

# 프로필 이미지 URL 확인
print("\n[album_img_url 결측치 개수]")
print(df["album_img_url"].isna().sum())

# album_img_url이 있는 샘플만 출력
sample_with_img = df[df["album_img_url"].notna()].sample(5)
print(sample_with_img[["name", "artists", "album_img_url"]])


# 난이도별 예시
print("\n[High 난이도 샘플]")
print(df[df["level"] == "High"][["id", "name", "artists", "level", "album_img_url"]].head(5))

print("\n[Medium 난이도 샘플]")
print(df[df["level"] == "Medium"][["id", "name", "artists", "level", "album_img_url"]].head(5))

print("\n[Low 난이도 샘플]")
print(df[df["level"] == "Low"][["id", "name", "artists", "level", "album_img_url"]].head(5))



print("===== songs_with_lyrics_and_timestamps_filtered.csv EDA =====")
# 기본 정보
print("\n[Shape]")
print(df_lyric.shape)

print("\n[컬럼명]")
print(df_lyric.columns.tolist())

print("\n[Bruno Mars 곡 리스트]")
bruno_songs = df[df["artists"].str.contains("Lany", case=False, na=False)]
print(bruno_songs[["id", "name", "artists", "popularity", "level"]].head(20))
print(f"\n총 Bruno Mars 곡 수: {len(bruno_songs)}")
