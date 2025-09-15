import pandas as pd

def main():
    # 1. 데이터 로드
    meta = pd.read_csv("data/songs_with_attributes_and_lyrics.csv")
    print("원본 데이터 크기:", meta.shape)

    # 2. 제거 조건: instrumentalness >= 0.8 OR liveness >= 0.8
    cond = (meta["instrumentalness"] >= 0.8) | (meta["liveness"] >= 0.8)

    # 3. 제거 통계 출력
    removed = cond.sum()
    total = len(meta)
    print(f"전체 곡 수: {total}")
    print(f"제거 대상 곡 수: {removed}")
    print(f"남은 곡 수: {total - removed} ({(total - removed)/total:.2%})")

    # 4. 필터링 적용
    filtered = meta[~cond]

    # 5. 저장
    filtered.to_csv("data/clean_meta.csv", index=False)
    print("clean_meta.csv 저장 완료!")

if __name__ == "__main__":
    main()
