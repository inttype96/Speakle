import pandas as pd

# 파일 로드
df = pd.read_csv("data/clean_meta_en_with_popularity.csv")

# 유명 아티스트 곡들 popularity = 80으로 업데이트
mask = df["artists"].str.contains("Dua Lipa", case=False, na=False)
df.loc[mask, "popularity"] = 80

print(f"총 {mask.sum()}개의 유명 아티스트 곡의 popularity를 80으로 업데이트 했습니다.")

# 변경된 데이터 확인
print(df[mask][["name", "artists", "popularity"]].head(10))

# 덮어쓰기 저장
output_path = "data/clean_meta_en_with_popularity.csv"
df.to_csv(output_path, index=False, encoding="utf-8")
print(f"업데이트 완료 → {output_path}")
