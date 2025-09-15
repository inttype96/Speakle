import pandas as pd

# 필터링할 금칙어 리스트 (교육용 앱 기준)
BAD_WORDS = [
    "nigga", "nigger", "faggot",
    "suicide", "kill myself", "hang myself", "cut myself", "slit my wrist", "bleed out",
    "rape", "molest", "pedophile", "pedo", "school shooting", "mass shooting", "gun down"
]

def contains_bad_word(text: str) -> bool:
    """가사에 금칙어가 포함되어 있는지 체크"""
    if not isinstance(text, str):
        return False
    text_lower = text.lower()
    return any(bad in text_lower for bad in BAD_WORDS)

def main():
    # 파일 경로
    lyrics_path = "data/songs_with_lyrics_and_timestamps_filtered3.csv"
    meta_path = "data/clean_meta_en_with_popularity.csv"
    out_lyrics = "data/songs_with_lyrics_and_timestamps_clean.csv"
    out_meta = "data/clean_meta_en_with_popularity_clean.csv"

    # 데이터 로드
    df_lyrics = pd.read_csv(lyrics_path)
    df_meta = pd.read_csv(meta_path)
    print("원본 lyrics:", df_lyrics.shape)
    print("원본 meta:", df_meta.shape)

    # 금칙어 포함 여부
    df_lyrics["has_bad_word"] = df_lyrics["words"].apply(contains_bad_word)

    # 금칙어 포함된 song_id 집합
    bad_song_ids = set(df_lyrics[df_lyrics["has_bad_word"]]["id"].unique())
    print(f"금칙어 포함된 노래 수: {len(bad_song_ids)}")

    # 필터링 적용
    df_lyrics_clean = df_lyrics[~df_lyrics["id"].isin(bad_song_ids)].drop(columns=["has_bad_word"])
    df_meta_clean = df_meta[~df_meta["id"].isin(bad_song_ids)]

    print("클린 lyrics:", df_lyrics_clean.shape)
    print("클린 meta:", df_meta_clean.shape)

    # 저장
    df_lyrics_clean.to_csv(out_lyrics, index=False)
    df_meta_clean.to_csv(out_meta, index=False)
    print(f"Saved cleaned lyrics → {out_lyrics}")
    print(f"Saved cleaned meta → {out_meta}")

if __name__ == "__main__":
    main()
