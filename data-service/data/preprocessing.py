import pandas as pd
import langid

# ---------------------------------------------------
# Step 1: Instrumentalness & Liveness 기반 필터링
# ---------------------------------------------------
def filter_instrumental_and_live(input_path="data/songs_with_attributes_and_lyrics.csv",
                                 output_path="data/clean_meta.csv"):
    meta = pd.read_csv(input_path)
    print("원본 데이터 크기:", meta.shape)

    cond = (meta["instrumentalness"] >= 0.8) | (meta["liveness"] >= 0.8)
    removed = cond.sum()
    total = len(meta)
    print(f"전체 곡 수: {total}")
    print(f"제거 대상 곡 수: {removed}")
    print(f"남은 곡 수: {total - removed} ({(total - removed)/total:.2%})")

    filtered = meta[~cond]
    filtered.to_csv(output_path, index=False)
    print(f"{output_path} 저장 완료!")


# ---------------------------------------------------
# Step 2: popularity 병합 (dataset.csv와 join)
# ---------------------------------------------------
def merge_popularity(meta_path="data/clean_meta_en.csv",
                     dataset_path="data/dataset.csv",
                     output_path="data/clean_meta_en_with_popularity.csv"):
    df_meta = pd.read_csv(meta_path)
    df_dataset = pd.read_csv(dataset_path)

    print("meta columns:", df_meta.columns)
    print("dataset columns:", df_dataset.columns)

    df_merged = pd.merge(
        df_meta,
        df_dataset[["track_id", "popularity"]],
        left_on="id",
        right_on="track_id",
        how="left"
    )

    df_merged = df_merged.drop(columns=["track_id"])

    df_merged["popularity"] = df_merged["popularity"].apply(
        lambda x: x if pd.notnull(x) and x >= 50 else pd.NA
    )

    print("✅ popularity 병합 완료")
    print(df_merged[["id", "name", "artists", "popularity"]].head(20))

    df_merged.to_csv(output_path, index=False)
    print(f"💾 저장 완료: {output_path}")


# ---------------------------------------------------
# Step 3: 유명 아티스트 보정 (예: Dua Lipa)
# ---------------------------------------------------
def update_popularity_for_famous_artists(meta_path="data/clean_meta_en_with_popularity.csv",
                                         output_path="data/clean_meta_en_with_popularity.csv"):
    df = pd.read_csv(meta_path)
    mask = df["artists"].str.contains("Dua Lipa", case=False, na=False)
    df.loc[mask, "popularity"] = 80
    print(f"총 {mask.sum()}개의 유명 아티스트 곡의 popularity를 80으로 업데이트 했습니다.")
    print(df[mask][["name", "artists", "popularity"]].head(10))

    df.to_csv(output_path, index=False, encoding="utf-8")
    print(f"업데이트 완료 → {output_path}")


# ---------------------------------------------------
# Step 4: 난이도(Level) 계산 + 이미지 매핑
# ---------------------------------------------------
def assign_level_and_img(meta_path="data/clean_meta_en.csv",
                         music_path="data/Music.csv",
                         output_path="data/clean_meta_en.csv"):
    engmeta = pd.read_csv(meta_path)
    music = pd.read_csv(music_path)

    def assign_level(row):
        score = 0
        score += row["speechiness"] * 40
        score += (1 - row["instrumentalness"]) * 30
        score += (row["energy"] * 0.5 + (row["loudness"] + 60) / 60 * 0.5) * 20
        score += (1 - row["acousticness"]) * 10
        if score >= 70:
            return "High"
        elif score >= 40:
            return "Medium"
        else:
            return "Low"

    levels = []
    for i, row in engmeta.iterrows():
        levels.append(assign_level(row))
        if i % 1000 == 0 and i > 0:
            print(f"[LOG] Processed {i} rows for level assignment...")

    engmeta["level"] = levels

    engmeta = engmeta.merge(
        music[["spotify_id", "img"]],
        how="left",
        left_on="id",
        right_on="spotify_id"
    )

    if "album_img_url" not in engmeta.columns:
        engmeta["album_img_url"] = None
    engmeta["album_img_url"] = engmeta["img"].combine_first(engmeta["album_img_url"])
    engmeta = engmeta.drop(columns=["spotify_id", "img"])

    engmeta.to_csv(output_path, index=False)
    print("album_img_url 컬럼 업데이트 완료!")
    print("매칭된 개수:", engmeta["album_img_url"].notna().sum())
    print("전체 개수:", len(engmeta))


# ---------------------------------------------------
# Step 5: 언어 감지 (영어만 필터링)
# ---------------------------------------------------
def filter_english(meta_path="data/clean_meta_en.csv",
                   output_path="data/clean_meta_en.csv"):
    meta = pd.read_csv(meta_path)

    def detect_language(text):
        if not isinstance(text, str) or text.strip() == "":
            return "unknown", 0
        lang, score = langid.classify(text[:900])
        return lang, score

    langs = []
    scores = []
    for i, lyric in enumerate(meta["lyrics"].fillna("")):
        lang, score = detect_language(lyric)
        langs.append(lang)
        scores.append(score)
        if (i + 1) % 1000 == 0:
            print(f"{i+1} / {len(meta)} processed... (last: {lang}, {score})")

    meta["lang"] = langs
    meta["lang_score"] = scores

    english_meta = meta[(meta["lang"] == "en") & (meta["lang_score"] < -50)]
    english_meta.to_csv(output_path, index=False)
    print("✅ 언어 필터링 완료!")
    print("원본 크기:", len(meta))
    print("영어 데이터 크기:", len(english_meta))


# ---------------------------------------------------
# Step 6: Lyrics & Meta 정제 (금칙어 필터링)
# ---------------------------------------------------
BAD_WORDS = [
    "nigga", "nigger", "faggot",
    "suicide", "kill myself", "hang myself", "cut myself", "slit my wrist", "bleed out",
    "rape", "molest", "pedophile", "pedo", "school shooting", "mass shooting", "gun down"
]

def contains_bad_word(text: str) -> bool:
    if not isinstance(text, str):
        return False
    text_lower = text.lower()
    return any(bad in text_lower for bad in BAD_WORDS)

def clean_bad_words(lyrics_path="data/songs_with_lyrics_and_timestamps_filtered3.csv",
                    meta_path="data/clean_meta_en_with_popularity.csv",
                    out_lyrics="data/songs_with_lyrics_and_timestamps_clean.csv",
                    out_meta="data/clean_meta_en_with_popularity_clean.csv"):
    df_lyrics = pd.read_csv(lyrics_path)
    df_meta = pd.read_csv(meta_path)
    print("원본 lyrics:", df_lyrics.shape)
    print("원본 meta:", df_meta.shape)

    df_lyrics["has_bad_word"] = df_lyrics["words"].apply(contains_bad_word)
    bad_song_ids = set(df_lyrics[df_lyrics["has_bad_word"]]["id"].unique())
    print(f"금칙어 포함된 노래 수: {len(bad_song_ids)}")

    df_lyrics_clean = df_lyrics[~df_lyrics["id"].isin(bad_song_ids)].drop(columns=["has_bad_word"])
    df_meta_clean = df_meta[~df_meta["id"].isin(bad_song_ids)]

    print("클린 lyrics:", df_lyrics_clean.shape)
    print("클린 meta:", df_meta_clean.shape)

    df_lyrics_clean.to_csv(out_lyrics, index=False)
    df_meta_clean.to_csv(out_meta, index=False)
    print(f"Saved cleaned lyrics → {out_lyrics}")
    print(f"Saved cleaned meta → {out_meta}")


# ---------------------------------------------------
# Step 7: Adult 라벨링
# ---------------------------------------------------
ADULT_WORDS = ["fuck", "shit", "damn", "ass", "bitch", "bastard"]

def contains_adult_word(text: str) -> bool:
    if not isinstance(text, str):
        return False
    text_lower = text.lower()
    return any(word in text_lower for word in ADULT_WORDS)

def label_adult(lyrics_path="data/songs_with_lyrics_and_timestamps_clean.csv",
                meta_path="data/clean_meta_en_with_popularity.csv",
                out_meta="data/clean_meta_en_with_popularity_with_adult.csv"):
    df_lyrics = pd.read_csv(lyrics_path)
    df_meta = pd.read_csv(meta_path)
    print("원본 lyrics:", df_lyrics.shape)
    print("원본 meta:", df_meta.shape)

    df_lyrics["is_adult_chunk"] = df_lyrics["words"].apply(contains_adult_word)
    adult_song_ids = set(df_lyrics[df_lyrics["is_adult_chunk"]]["id"].unique())

    if "lyrics" in df_meta.columns:
        df_meta["is_adult_text"] = df_meta["lyrics"].apply(contains_adult_word)
        adult_song_ids |= set(df_meta[df_meta["is_adult_text"]]["id"].unique())

    df_meta["is_adult"] = df_meta["id"].isin(adult_song_ids)

    total_songs = df_meta.shape[0]
    adult_songs = df_meta["is_adult"].sum()
    print(f"전체 노래 수: {total_songs}")
    print(f"19세 판정 노래 수: {adult_songs}")
    print(f"비율: {adult_songs / total_songs:.2%}")

    df_meta.to_csv(out_meta, index=False)
    print(f"Saved → {out_meta}")


# ---------------------------------------------------
# Step 8: Lyrics 매칭 및 chunk_idx 생성
# ---------------------------------------------------
def match_and_chunk(meta_path="data/clean_meta_en_with_popularity.csv",
                    lyrics_path="data/songs_with_lyrics_and_timestamps_filtered.csv",
                    output_path="data/songs_with_lyrics_and_timestamps_filtered3.csv"):
    df_meta = pd.read_csv(meta_path)
    df_lyrics = pd.read_csv(lyrics_path)

    print("meta columns:", df_meta.columns)
    print("lyrics columns:", df_lyrics.columns)

    valid_song_ids = set(
        df_meta.loc[df_meta["popularity"].notna() & (df_meta["popularity"] >= 50), "id"].astype(str).unique()
    )
    print(f"유효 song_id 개수: {len(valid_song_ids):,}")

    if "id" not in df_lyrics.columns:
        raise KeyError("'songs_with_lyrics_and_timestamps.csv'에 'id' 컬럼이 없습니다.")

    df_filtered = df_lyrics[df_lyrics["id"].astype(str).isin(valid_song_ids)].reset_index(drop=True)
    print(f"필터링 완료: {len(df_filtered):,} rows 남음")

    df_filtered["chunk_idx"] = df_filtered.groupby("id").cumcount()
    print("chunk_idx 생성 완료 (노래별 순차 증가, 중복 없음)")

    df_filtered.to_csv(output_path, index=False, encoding="utf-8")
    print(f"저장 완료: {output_path}")


# ---------------------------------------------------
# 실행 순서
# ---------------------------------------------------
def main():
    # 1. 악기/라이브 비율 기반 필터링
    filter_instrumental_and_live()

    # 2. popularity 병합
    merge_popularity()

    # 3. 유명 아티스트 보정
    update_popularity_for_famous_artists()

    # 4. 난이도 및 이미지 매핑
    assign_level_and_img()

    # 5. 언어 필터링 (영어만)
    filter_english()

    # 6. 금칙어 필터링
    clean_bad_words()

    # 7. Adult 라벨링
    label_adult()

    # 8. Lyrics 매칭 및 chunk_idx 생성
    match_and_chunk()


if __name__ == "__main__":
    main()
