import pandas as pd

def main():
    # 파일 불러오기
    df_meta = pd.read_csv("data/clean_meta_en_with_popularity.csv")
    df_lyrics = pd.read_csv("data/songs_with_lyrics_and_timestamps_filtered.csv")

    print("meta columns:", df_meta.columns)
    print("lyrics columns:", df_lyrics.columns)

    # 1) 유효한 song_id 집합
    valid_song_ids = set(
        df_meta.loc[df_meta["popularity"].notna() & (df_meta["popularity"] >= 50), "id"].astype(str).unique()
    )
    print(f"유효 song_id 개수: {len(valid_song_ids):,}")

    # 2) 필터링 (meta에 있는 song_id만 남기기)
    if "id" not in df_lyrics.columns:
        raise KeyError("'songs_with_lyrics_and_timestamps.csv'에 'id' 컬럼이 없습니다. 확인해주세요.")

    df_filtered = df_lyrics[df_lyrics["id"].astype(str).isin(valid_song_ids)].reset_index(drop=True)
    print(f"필터링 완료: {len(df_filtered):,} rows 남음")

    # 3) song_id별 chunk_idx 생성
    df_filtered["chunk_idx"] = df_filtered.groupby("id").cumcount()
    print("chunk_idx 생성 완료 (노래별 순차 증가, 중복 없음)")

    # 4) 저장
    output_path = "data/songs_with_lyrics_and_timestamps_filtered3.csv"
    df_filtered.to_csv(output_path, index=False, encoding="utf-8")
    print(f"저장 완료: {output_path}")

if __name__ == "__main__":
    main()
