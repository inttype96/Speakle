import pandas as pd
import langid

# 1. 데이터 로드
meta = pd.read_csv("data/clean_meta_en.csv")

# 2. 언어 감지 함수
def detect_language(text):
    if not isinstance(text, str) or text.strip() == "":
        return "unknown", 0
    lang, score = langid.classify(text[:900])  # 앞 500자만 사용
    return lang, score

# 3. 진행 로그 추가
langs = []
scores = []
for i, lyric in enumerate(meta["lyrics"].fillna("")):
    lang, score = detect_language(lyric)
    langs.append(lang)
    scores.append(score)

    # 1,000개마다 로그 찍기
    if (i + 1) % 1000 == 0:
        print(f"{i+1} / {len(meta)} processed... (last: {lang}, {score})")

# 4. 결과 컬럼 추가
meta["lang"] = langs
meta["lang_score"] = scores

# 5. 영어만 필터링
english_meta = meta[(meta["lang"] == "en") & (meta["lang_score"] < -50)]

# 6. 저장
english_meta.to_csv("data/clean_meta_en.csv", index=False)

print("✅ 처리 완료!")
print("원본 크기:", len(meta))
print("영어 데이터 크기:", len(english_meta))
