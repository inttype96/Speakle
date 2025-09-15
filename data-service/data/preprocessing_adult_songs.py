import pandas as pd

# 자주 나오는 욕설 리스트 (19세 분류용)
ADULT_WORDS = ["fuck", "shit", "damn", "ass", "bitch", "bastard"]

def contains_adult_word(text: str) -> bool:
    """욕설 포함 여부"""
    if not isinstance(text, str):
        return False
    text_lower = text.lower()
    return any(word in text_lower for word in ADULT_WORDS)

def main():
    # 파일 경로
    lyrics_path = "data/songs_with_lyrics_and_timestamps_clean.csv"
    meta_path = "data/clean_meta_en_with_popularity.csv"
    out_meta = "data/clean_meta_en_with_popularity_with_adult.csv"

    # 데이터 로드
    df_lyrics = pd.read_csv(lyrics_path)
    df_meta = pd.read_csv(meta_path)
    print("원본 lyrics:", df_lyrics.shape)
    print("원본 meta:", df_meta.shape)

    # lyrics에서 song_id 단위로 adult 여부 체크
    df_lyrics["is_adult_chunk"] = df_lyrics["words"].apply(contains_adult_word)
    adult_song_ids = set(df_lyrics[df_lyrics["is_adult_chunk"]]["id"].unique())

    # meta에서도 lyrics 텍스트 기반 체크
    if "lyrics" in df_meta.columns:
        df_meta["is_adult_text"] = df_meta["lyrics"].apply(contains_adult_word)
        adult_song_ids |= set(df_meta[df_meta["is_adult_text"]]["id"].unique())

    # 최종 adult 라벨링
    df_meta["is_adult"] = df_meta["id"].isin(adult_song_ids)

    # 통계 출력
    total_songs = df_meta.shape[0]
    adult_songs = df_meta["is_adult"].sum()
    print(f"전체 노래 수: {total_songs}")
    print(f"19세 판정 노래 수: {adult_songs}")
    print(f"비율: {adult_songs / total_songs:.2%}")

    # 저장
    df_meta.to_csv(out_meta, index=False)
    print(f"Saved → {out_meta}")

if __name__ == "__main__":
    main()
