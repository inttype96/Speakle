# English-to-Korean Translation Model (LoRA Fine-tuned)

## 📌 Overview
본 모델은 공개 번역 모델 `NHNDQ/nllb-finetuned-en2ko`를 기반으로,  
추가적인 **도메인 특화 데이터**와 **LoRA (Low-Rank Adaptation)** 기법을 적용하여  
특히 **가사 번역에 적합한 성능**을 목표로 개발된 영어 → 한국어(En → Ko) 번역 모델입니다.  

`NHNDQ/nllb-finetuned-en2ko`는 Meta AI의 `facebook/nllb-200-distilled-600M`을  
기반으로 영어 → 한국어 번역에 특화되도록 파인 튜닝된 모델입니다.  
해당 모델은 뉴스 등 일반적인 텍스트 데이터를 학습하여  
**영어 학습 및 일반 문맥 번역에 적합한 성능**을 보이는 것으로 판단되었습니다.  

---

## 📊 Dataset
학습에 사용된 데이터는 다음과 같습니다:
- **Kaggle Spotify Lyrics Dataset**: 약 **40,000건**의 영어 노래 가사 데이터에 GPT-5 모델로 곡단위로 해석한 한국어 번역 


---

## ⚙️ Training Details

### Fine-tuning Method
- **Base Model**: `facebook/nllb-200-distilled-600M`  
- **Intermediate Model**: `NHNDQ/nllb-finetuned-en2ko`  
- **Fine-tuning Strategy**: **LoRA (Low-Rank Adaptation)**  

### Training Parameters
- **Epochs**: 8 (약 3,000 step 체크포인트 결과 활용)  
- **Batch size**: 16 (per-device, Gradient Accumulation 8 → 유효 배치 128)  
- **Learning rate**: 1e-4 (LoRA 파라미터 학습률, 권장 범위: 1e-4 ~ 2e-4)  
- **Optimizer**: AdamW (weight decay = 0.01)  
- **Scheduler**: Cosine Annealing (warmup steps = 1,000)  
- **Max input/output length**: 256 tokens (가사 1줄 기준 충분, 기존 권장값 128 대비 확장)  
- **Checkpoint/Evaluation frequency**: 1,000 steps  

---

### LoRA Configuration
- **Rank (r)**: 8  
- **Alpha**: 16  
- **Dropout**: 0.05  
- **Target modules**: `["q_proj", "v_proj"]` (Encoder + Decoder 전 층 적용)  

---

## 🔎 Decoding Strategy
모델 추론 시 적용한 디코딩 방식은 다음과 같습니다:

- **Decoding Method**: Beam Search  
- **Beam size**: 4  
- **Top-k**: 적용하지 않음 (기본값)  
- **Top-p (nucleus sampling)**: 적용하지 않음 (기본값)  
- **Temperature**: 적용하지 않음 (deterministic decoding)  
- **Max input length**: 128 tokens  
- **Max output length**: 128 tokens  
- **Batch size (inference)**: 64  

즉, 본 모델은 **Beam Search (beam=4)** 기반의 결정적(decoding without sampling) 디코딩 전략을 사용하였으며,  
Sampling 기반 기법(Top-k, Top-p, Temperature)은 사용하지 않았습니다. 

---

## ⚠️ Limitations
- gpt 응답 원문에 대해 재가공 수행 하지 않음. (영어를 한글로 읽는 행위, 영어 그대로 한국어 번역에 들어간 데이터, 반복 후렴 등 제외 미시도) 
- 문맥적으로 모호한 입력에 대해 부자연스러운 번역 가능성 존재  

---

