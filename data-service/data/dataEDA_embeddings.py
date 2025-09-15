import pandas as pd

def inspect_parquet(path: str, n: int = 5):
    print(f"\n===== {path} =====")
    df = pd.read_parquet(path)

    # 기본 정보
    print("Shape:", df.shape)
    print("Columns:", df.columns.tolist())

    # Null 값 비율
    print("\nNull counts:")
    print(df.isna().sum())

    # 샘플 데이터
    print(f"\nSample {n} rows:")
    print(df.head(n))

    return df


if __name__ == "__main__":
    # 파일 경로
    file1 = r"C:\ssafy\S13P21C104\data-service\data\song_embeddings_full_songs.parquet"
    file2 = r"C:\ssafy\S13P21C104\data-service\data\song_embeddings_with_timestamps_01.parquet"

    df1 = inspect_parquet(file1)
    df2 = inspect_parquet(file2)

    # embedding 벡터 길이 확인
    if "embedding" in df1.columns:
        print("\nEmbedding vector length (full songs):", len(df1.iloc[0]["embedding"]))

    if "embedding" in df2.columns:
        print("\nEmbedding vector length (timestamps):", len(df2.iloc[0]["embedding"]))
