import pandas as pd

engmeta = pd.read_csv("data/clean_meta_en.csv")
music = pd.read_csv("data/Music.csv")

def assign_level(row):
    score = 0
    
    # Speechiness: 말이 많으면 난이도 ↑
    score += row["speechiness"] * 40   # 가중치 40
    
    # Instrumentalness: 보컬 없으면 난이도 낮음 → (1 - instrumentalness)
    score += (1 - row["instrumentalness"]) * 30  # 가중치 30
    
    # Energy + Loudness: 시끄럽고 에너제틱할수록 난이도 살짝 ↑
    score += (row["energy"] * 0.5 + (row["loudness"] + 60) / 60 * 0.5) * 20  # loudness -60 ~ 0dB 정규화
    
    # Acousticness: 어쿠스틱할수록 난이도 ↓
    score += (1 - row["acousticness"]) * 10
    
    # 최종 score → level 변환
    if score >= 70:
        return "High"
    elif score >= 40:
        return "Medium"
    else:
        return "Low"

# 적용
levels = []
for i, row in engmeta.iterrows():
    levels.append(assign_level(row))
    if i % 1000 == 0 and i > 0:
        print(f"[LOG] Processed {i} rows for level assignment...")

engmeta["level"] = levels

engmeta = engmeta.merge(
    music[["spotify_id", "img"]],
    how="left",
    left_on="id",      # engmeta 기준 id = spotify_id
    right_on="spotify_id"
)

# album_img_url 컬럼이 없으면 새로 생성
if "album_img_url" not in engmeta.columns:
    engmeta["album_img_url"] = None

# img 값으로 업데이트
engmeta["album_img_url"] = engmeta["img"].combine_first(engmeta["album_img_url"])

# 불필요한 컬럼 제거
engmeta = engmeta.drop(columns=["spotify_id", "img"])

# 저장
engmeta.to_csv("data/clean_meta_en.csv", index=False)

print("album_img_url 컬럼 업데이트 완료!")
print("매칭된 개수:", engmeta["album_img_url"].notna().sum())
print("전체 개수:", len(engmeta))