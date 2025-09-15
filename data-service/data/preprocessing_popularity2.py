import pandas as pd

def main():
    input_path = "data/clean_meta_en_with_popularity_with_adult.csv"
    output_path = "data/clean_meta_en_with_popularity_with_adult_pop50.csv"

    # 데이터 로드
    df = pd.read_csv(input_path)
    print("원본 meta:", df.shape)

    # popularity 기준 필터링
    if "popularity" not in df.columns:
        raise ValueError("CSV에 'popularity' 컬럼이 없습니다.")

    df_filtered = df[df["popularity"] >= 50].copy()
    print("필터링 후:", df_filtered.shape)

    # 저장
    df_filtered.to_csv(output_path, index=False)
    print(f"Saved → {output_path}")

if __name__ == "__main__":
    main()
