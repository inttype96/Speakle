# 🎵 Speakle - 빅데이터 기반 맞춤형 팝송 추천 영어학습 플랫폼

#### SSAFY 13기 2학기 광주 1반 sevencode (25.08.25 ~ 25.09.29)

![](/README_img/메인페이지.png)

---

## 📑 목차

- [프로젝트 개요](#overview)
    - [팀원 소개](#team)
    - [기획 배경](#background)
- [서비스 소개](#service)
    - [시연 영상](#demo)
    - [서비스 화면 및 기능](#screens)
- [개발 환경](#env)
- [프로젝트 구조](#structure)
- [협업 환경](#collab)
- [프로젝트 산출물](#deliverables)
    - [API 명세서](#api)
    - [ERD](#erd)
    - [아키텍처](#architecture)

---

## 📌 프로젝트 개요 <a id="overview"></a>

### 1️⃣ 팀원 소개 <a id="team"></a>

|                     임덕규                      |                     최승훈                      |                     하기환                      |                  sevencode                   |
|:--------------------------------------------:|:--------------------------------------------:|:--------------------------------------------:|:--------------------------------------------:|
| ![](frontend/src/assets/images/headset2.png) | ![](frontend/src/assets/images/headset2.png) | ![](frontend/src/assets/images/headset2.png) | ![](frontend/src/assets/images/headset2.png) |
|               Leader, FrontEnd               |               FrontEnd, DevOps               |              FrontEnd               |                     C104                     |
|                     강성민                      |                     김소연                      |                     김아윤                      |                     정수형                      |
| ![](frontend/src/assets/images/headset2.png) | ![](frontend/src/assets/images/headset2.png) | ![](frontend/src/assets/images/headset2.png) | ![](frontend/src/assets/images/headset2.png) |
|                   BackEnd                    |               BackEnd, BigData               |                   BackEnd                   |                   BackEnd                   |

### 2️⃣ 기획 배경 <a id="background"></a>

***많은 학습자들이 영어 학습에 시간을 투자하지만, 실제 회화 능력은 기대만큼 향상되지 않아 어려움을 겪고 있습니다.***

>
> * 딱딱하고 재미없는 교재 중심의 학습
> * 실생활과 동떨어진 영어 표현 학습
> * 높은 학습 비용과 시간적 제약
> * 학습 동기 부족으로 인한 지속성 문제 

현재 많은 영어 학습자들이 효과적이고 즐거운 학습 방법을 찾고 있지만,
개인화되지 않은 학습 콘텐츠와 단조로운 학습 방식으로 인해
효과적인 학습와 지속적인 동기 부여에 어려움을 겪고 있습니다.

이러한 문제를 해결하기 위해 **Speakle**이 탄생했습니다. </br> </br>
**"즐겁게 듣고, 따라 부르고, 배우는 영어"** </br> </br>
Speakle은 **빅데이터 추천 시스템**을 활용하여
사용자가 원하는 상황과 장소 맞춤형 팝송을 추천합니다.
또한 팝송 가사를 학습 콘텐츠로 변환하여,
**재미와 학습 효과**를 동시에 높일 수 있는 경험을 제공합니다.

저희는 이 서비스를 통해
음악으로 자연스럽고 즐겁게 영어를 배우면서,
실제 회화 능력까지 성장시킬 수 있는 재밌는 영어 학습 경험을 제공하고자 합니다.

---
## 🖥️ 서비스 소개 <a id="service"></a>

### 1️⃣ 영상 포트폴리오 <a id="demo"></a>

[🔗 영상 포트폴리오 바로가기](https://youtu.be/bbPm0lDMA48)

### 2️⃣ 서비스 화면 및 기능 <a id="screens"></a>

#### 1) 사이트 소개

|                 메인 페이지                  |               사이드바               |
|:---------------------------------------:|:--------------------------------:|
| ![메인 페이지](/README_img/메인페이지.png) | ![사이드바](/README_img/사이드바.png) |

* 메인 페이지에서는 **노래 추천** 및 **랜덤 노래 추천 바로가기** 기능을 통해 팝송 추천받을 수 있습니다.
* 사이드바를 통해 원하는 페이지로 쉽게 이동할 수 있습니다.
***

|               회원가입               |              로그인               |
|:--------------------------------:|:------------------------------:|
| ![회원가입](/README_img/회원가입페이지.png) | ![로그인](/README_img/로그인페이지.png) |

* 사용자는 이메일 인증을 통해 회원가입을 진행할 수 있습니다.
* 회원가입한 아이디와 비밀번호를 입력하여 로그인을 진행할 수 있습니다.
***

|              둘러보기               |
|:-------------------------------:|
| ![둘러보기](/README_img/둘러보기전체.png) |

* 사이트의 전체적인 기능들을 확인할 수 있습니다.
***

|             플레이리스트             |                플레이리스트 상세                |
|:------------------------------:|:---------------------------------------:|
| ![플레이리스트](/README_img/플레이리스트.png) | ![플레이리스트 상세](/README_img/플레이리스트 상세.png) |

* 사용자는 원하는 팝송을 플레이리스트에 **추가하거나 삭제**할 수 있습니다.
* 플레이리스트를 통해 자주 듣는 노래를 **쉽게 관리하고 접근**할 수 있습니다.
***

|              리워드 대시보드               |              마이페이지              |
|:-----------------------------------:|:-------------------------------:|
| ![리워드대시보드페이지](/README_img/리워드대시보드페이지.png) | ![마이페이지](/README_img/마이페이지.png) |

* 연속 학습 일수, 포인트, 최근 학습 내역, 포인트 랭킹을 확인할 수 있습니다.
* 닉네임 수정 및 스포티파이(Spotify) 계정 연동 관리가 가능합니다.
***

|                노래추천                |                 노래추천 입력상세                  |
|:----------------------------------:|:------------------------------------------:|
| ![노래추천페이지전체](/README_img/노래추천페이지전체.png) | ![노래추천페이지_상세](/README_img/노래추천페이지_상세1.png) |

* 사용자는 원하는 상황과 장소를 입력하여 맞춤형 노래를 추천받을 수 있습니다.
* 더보기 버튼을 통해 더 다양한 상황과 장소를 확인하거나 직접 입력할 수 있습니다.
***

|              추천 로딩               |              추천 페이지              |
|:--------------------------------:|:--------------------------------:|
| ![추천로딩페이지](/README_img/추천로딩페이지.png) | ![추천페이지_전체](/README_img/추천페이지_전체.png) |

* 노래 추천을 처리하는 동안 로딩 화면이 표시됩니다.
* 추천 결과 페이지에서 추천된 팝송들을 확인할 수 있습니다.
***

|                 노래 상세 페이지                 |               노래 하이라이트                |
|:-----------------------------------------:|:-------------------------------------:|
| ![노래상세페이지_하이라이트](/README_img/노래상세페이지.png) | ![노래상세페이지_하이라이트](/README_img/노래상세페이지_하이라이트.png) |

* 해당 노래의 상세 정보와 가사를 확인할 수 있습니다.
* 한국어 번역 가사가 제공되며, 노래 진행에 맞춰 해당 가사가 하이라이트됩니다.
***

|                  유용한학습_단어                  |                 유용한학습_문장                  |                  유용한학습_표현                   |                   유용한학습_관용구                   |
|:------------------------------------------:|:-----------------------------------------:|:-------------------------------------------:|:---------------------------------------------:|
| ![노래유용한학습_단어](/README_img/유용한학습_단어_전체.png) | ![노래유용한학습_문장](/README_img/노래유용한학습_문장.png) | ![유용한학습_표현_전체](/README_img/유용한학습_표현_전체.png) | ![유용한학습_관용구_전체](/README_img/유용한학습_관용구_전체.png) |

* 가사에서 등장하는 중요 단어, 문장, 표현, 관용구를 따로 모아 학습할 수 있습니다.
* 이를 통해 노래로 학습한 영어를 실제 회화로 확장할 수 있습니다.
***

|               집중학습_빈칸               |                집중학습_빈칸_정답                 |                 집중학습_빈칸_오답                 |                 집중학습_빈칸_결과                  |
|:-----------------------------------:|:-----------------------------------------:|:------------------------------------------:|:-------------------------------------------:|
| ![집중학습_빈칸](/README_img/집중학습_빈칸.png) | ![집중학습_빈칸_정답](/README_img/집중학습_빈칸_정답.png) | ![집중학습_빈칸_오답](/README_img/집중학습_빈칸_오답.png) | ![집중학습_빈칸_결과](/README_img/집중학습_빈칸_결과.png) |

* 가사의 일부 단어가 비워진 빈칸 문제를 풀며 학습할 수 있습니다.
* 정답과 오답을 확인하고 학습 결과를 확인할 수 있습니다.
***

|              집중학습_스피킹               |                집중학습_스피킹_녹음                 |                집중학습_스피킹_결과                 |                집중학습_스피킹_결과_종합                 |
|:-----------------------------------:|:------------------------------------------:|:------------------------------------------:|:---------------------------------------------:|
| ![집중학습_스피킹](/README_img/집중학습_스피킹.png) | ![집중학습_스피킹_녹음](/README_img/집중학습_스피킹_녹음.png) | ![집중학습_스피킹_결과](/README_img/집중학습_스피킹_결과.png) | ![집중학습_스피킹_결과_종합](/README_img/집중학습_스피킹_결과_종합.png) |

* 사용자는 가사를 직접 발음하고 녹음하여 발음 정확도를 평가받을 수 있습니다.
* 수정필요
***

|               집중학습_딕테이션               |                집중학습_딕테이션_힌트                 |               집중학습_딕테이션_결과_정답               |                  집중학습_딕테이션_결과_종합                  |
|:-------------------------------------:|:-------------------------------------------:|:-------------------------------------------:|:-------------------------------------------------:|
| ![집중학습_딕테이션](/README_img/집중학습_딕테이션.png) | ![집중학습_딕테이션_힌트](/README_img/집중학습_딕테이션_힌트.png) | ![집중학습_딕테이션_결과_정답](/README_img/집중학습_딕테이션_결과_정답.png) | ![집중학습_딕테이션_결과_종합](/README_img/집중학습_딕테이션_결과_종합.png) |

* 노래를 들으며 가사를 직접 입력하는 딕테이션 학습이 가능합니다.
* 수정필요

---

## 🛠️ 개발 환경 <a id="env"></a>


|                                                                                                                                                             **BackEnd**                                                                                                                                                             |
|:-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------:|
| ![Java](https://img.shields.io/badge/Java-17.0.15-orange) ![Spring Boot](https://img.shields.io/badge/SpringBoot-3.3.3-green) ![Spring Security](https://img.shields.io/badge/Security-SpringSecurity-brightgreen) ![JWT](https://img.shields.io/badge/Auth-JWT-blue) ![REST API](https://img.shields.io/badge/API-REST-blueviolet) |\
|![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL_15-316192) ![JPA](https://img.shields.io/badge/Persistence-JPA-red) ![Gradle](https://img.shields.io/badge/Build-Gradle_8.5-02303A) ![Redis](https://img.shields.io/badge/Cache-Redis_8.2.1-DC382D)|

---

| **FrontEnd** |
|:-------------------------------------:|
|![Node](https://img.shields.io/badge/Node-22.15.0-5FA04E) ![NPM](https://img.shields.io/badge/NPM-11.4.2-CB3837) ![React](https://img.shields.io/badge/Frontend-React_19.1.1-61DAFB) ![React Router](https://img.shields.io/badge/Router-ReactRouter-CA4245) ![TailwindCSS](https://img.shields.io/badge/Style-Tailwindcss_4.1.13-38B2AC) ![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6) ![Zustand](https://img.shields.io/badge/State-Zustand_5.0.8-FFCA28)|

---

| **AI / Data** |
|:-------------------------------------:|
|![Python](https://img.shields.io/badge/Python-3.11.9-3776AB) ![FastAPI](https://img.shields.io/badge/API-FastAPI_0.116.1-009688) ![Weaviate](https://img.shields.io/badge/VectorDB-Weaviate_1.24.12-EB5424)|

---

| **Infra / DevOps** |
|:-------------------------------------:|
|![Docker](https://img.shields.io/badge/Container-Docker_28.4.0-2496ED) ![Nginx](https://img.shields.io/badge/Proxy-Nginx_2.12.6-009639) ![Portainer](https://img.shields.io/badge/Manager-Portainer_2.33.1_LTS-13BEF9) ![Netdata](https://img.shields.io/badge/Monitor-Netdata_2.7.0-FF6F00) ![Jenkins](https://img.shields.io/badge/CI-CD-Jenkins_2.516.2--1-D24939)|

---


---

## 📁 프로젝트 구조 <a id="structure"></a>

```
S13P21C104/
├── frontend/               # React Frontend Application
│   ├──📁api               # 백엔드와 통신하는 API 모듈
│   ├──📁assets            # 정적 자원(이미지, 아이콘 등)
│   │   └──📁icons         # UI에 사용하는 아이콘 모음
│   ├──📁components        # 재사용 가능한 UI 컴포넌트
│   │   ├──📁common        # 버튼, 입력창 등 공용 컴포넌트
│   │   ├──📁modals        # 모달 창 컴포넌트
│   │   ├──📁navigation    # 네비게이션 바, 메뉴 등
│   │   ├──📁signup        # 회원가입 전용 UI
│   │   ├──📁TherapistSession  # 치료사 세션 관련 UI
│   │   └──📁TherapistToolTap  # 치료사 툴 관련 UI
│   ├──📁contexts          # React Context API 상태 관리
│   ├──📁hooks             # 커스텀 훅 모음
│   ├──📁logoimage         # 서비스 로고 이미지
│   └──📁pages             # 페이지 단위 컴포넌트
│       ├──📁Auth          # 로그인/회원가입 등 인증 페이지
│       ├──📁signup        # 회원가입 관련 페이지
│       ├──📁Therapist     # 치료사 전용 페이지
│       │    └──📁MyPage   # 치료사 마이페이지
│       └──📁User          # 일반 사용자 페이지
│           ├──📁Booking   # 예약 관련 페이지
│           └──📁MyPage    # 사용자 마이페이지
│
├── backend/                     # Spring Boot Backend Application
│   ├──📄settings.gradle               # Gradle 루트 설정(Groovy DSL)
│   ├──📄build.gradle                  # 프로젝트 빌드 스크립트(Groovy DSL)
│   └──📁src
│       └──📁main
│           ├──📁java
│           │   └──📁com
│           │       └──📁example
│           │           └──📁app
│           │               ├──📄Application.java   # @SpringBootApplication 진입점
│           │               │
│           │               ├──📁config            # @Configuration, WebMvcConfigurer, Jackson, CORS 등 공용 설정
│           │               ├──📁util              # 문자열, 날짜, 암호화 등 범용 유틸
│           │               ├──📁exception         # 공용 예외 처리, @ControllerAdvice
│           │               ├──📁jwt               # JWT 생성/검증, 필터, SecurityConfig 등
│           │               │
│           │               └──📁something         # 특정 도메인(비즈니스 기능 단위)
│           │                   ├──📁controller    # REST API 엔드포인트
│           │                   ├──📁service       # 비즈니스 로직(@Service, @Transactional)
│           │                   ├──📁repository    # 데이터 접근 계층(JPA/QueryDSL)
│           │                   ├──📁entity        # JPA 엔티티
│           │                   ├──📁dto
│           │                   │   ├──📁request   # 요청 DTO(검증 포함)
│           │                   │   └──📁response  # 응답 DTO(엔티티 직접 노출 금지)
│           │                   └──📁exception     # 도메인 전용 예외
│           │
│           └──📁resources
│               └──📄application.properties        # 스프링 설정(ENV 값 주입 가능)
│
├── data-service/                # FastAPI AI/ML Service
│   ├── app/
│   │   ├── api/               # API 엔드포인트
│   │   ├── core/              # 핵심 설정
│   │   ├── models/            # ML 모델
│   │   ├── services/          # 비즈니스 로직
│   │   └── utils/             # 유틸리티
│   ├── data/                  # 데이터 파일
│   ├── requirements.txt
│   └── Dockerfile
│
├── infrastructure/              # 인프라 설정
├── docs/                       # 문서
├── exec/                       # 실행 관련 파일
├── docker-compose.yml          # 개발환경 Docker Compose
├── docker-compose-fastapi.yml  # FastAPI 전용 Docker Compose
└── README.md
```

---

## 🤝 협업 환경 <a id="collab"></a>

### 버전 관리
- **Git**: GitLab
- **브랜치 전략**: GitHub Flow
  - `master`: 프로덕션 배포 브랜치
  - `develop`: 개발 브랜치
  - `feature/*`: 기능 개발 브랜치
  - `fix/*`: 버그 수정 브랜치
  - `refactor/*`: 리팩토링 브랜치
  - `docs/*`: 문서 브랜치
    ![branch](/README_img/speakle_branch_simple.png)

### 이슈 관리
- **Jira**: 스프린트 및 이슈 추적
  ![Jira](/README_img/speakle_jira.png)

### 커뮤니케이션
- **Notion**: 프로젝트 문서화, 회의록, 기술 스택 정리
- **Mattermost**: 실시간 커뮤니케이션
  ![Notion](/README_img/speakle_notion.png)

### 코드 리뷰
- **GitLab Merge Request**: 코드 리뷰 및 승인 프로세스
- **코드 컨벤션**: ESLint, Prettier (Frontend), Checkstyle (Backend)

---

## 📋 프로젝트 산출물 <a id="deliverables"></a>

### 📄 API 명세서 <a id="api"></a>
- | [🔗 API 명세서 바로가기](https://gelatinous-sunstone-af7.notion.site/API-262cb890f99981a7a8b4cf4d874aaa48?source=copy_link) |
- **Swagger UI**: `/swagger-ui.html` (Backend 서버 실행 시)

### 🗄️ ERD <a id="erd"></a>
![ERD](/README_img/speakle_erd.png)

### 🏗️ 아키텍처 <a id="architecture"></a>

![architecture](/README_img/speakle_architecture.png)

---

## License & Data Attribution

### Model Information  

1. **Embedding Model**  
   - [`Qwen/Qwen3-Embedding-0.6B`](https://huggingface.co/Qwen/Qwen3-Embedding-0.6B)  
   - License: [Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0)  
     - 상업적 이용, 수정, 배포가 허용됩니다.  
     - 저작권 고지 및 라이선스 사본을 포함해야 하며, 변경사항이 있을 경우 이를 명시해야 합니다.  
     - 보증이 제공되지 않으며, 책임 제한 조항이 적용됩니다.  

2. **Translation Model**  
   - [`NHNDQ/nllb-finetuned-en2ko`](https://huggingface.co/NHNDQ/nllb-finetuned-en2ko)  
   - License: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.ko)  
     - 원저작자 표시(CC Attribution), 라이선스 링크 제공, 변경사항 고지가 필요합니다.  
     - 복제, 배포, 전시, 공연, 포맷 변경, 영리적 이용 및 2차적 저작물 작성이 허용됩니다.  
     - 추가적인 법적/기술적 제한을 부가할 수 없습니다.  

---

### Dataset Information  

1. **960K Spotify Songs Lyrics Qwen3-0.6B Embeddings**  
   - License: [Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0)  

2. **960K Spotify Songs With Lyrics data**  
   - License: [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.ko)  
   - 비영리적 목적의 공유 및 변경 가능, 동일한 라이선스로 배포해야 함.  
   - 상업적 이용 불가.  

3. **Dataset of 65,000+ Songs on Spotify (with images)**  
   - License: [CC0: Public Domain](https://creativecommons.org/publicdomain/zero/1.0/deed.ko)  
   - 저작권 제한 없음, 자유롭게 사용 가능.  

4. **Spotify Tracks Attributes and Popularity**  
   - License: 원 출처(ConquestAce/spotify-songs)의 오리지널 라이선스 적용.  
   - 사용 전 반드시 해당 원본 저장소의 라이선스 조건 확인 필요.  

---

## Usage Notes  

- 본 프로젝트는 연구와 실험적 활용을 우선합니다.  
- 모델 라이선스:  
  - **Qwen3-Embedding-0.6B (Apache 2.0)** → 상업적 활용 가능, 단 저작자 표시 및 라이선스 고지 필수.  
  - **nllb-finetuned-en2ko (CC BY 4.0)** → 상업적 활용 가능, 단 출처 및 변경사항 고지 필수.  
- 데이터셋 라이선스:  
  - **Apache 2.0 / CC0** → 상업적 활용 가능.  
  - **CC BY-NC-SA 4.0** → 비영리 목적에서만 활용 가능.  
  - **출처 기반 라이선스(ConquestAce/spotify-songs)** → 원 저장소의 라이선스 조건 준수 필요.  
- 상업적 적용을 고려할 경우, **비영리 전용 데이터셋(CC BY-NC-SA 4.0)** 은 반드시 제외하거나 대체 데이터를 확보해야 합니다.  
- 데이터셋 및 모델 활용 시, 각 라이선스 조건(저작자 표시, 라이선스 사본 포함, 변경사항 고지 등)을 반드시 준수해야 합니다.  
