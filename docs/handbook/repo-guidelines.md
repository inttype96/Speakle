# Repository Guidelines

---

## 개요

이 문서는 본 프로젝트의 GitLab Repository 구조와 각 디렉토리의 역할, 그리고 향후 확장 가능한 영역을 설명합니다.
목적은 팀원 간 일관성 있는 코드/문서 관리와 협업 효율성 확보입니다.

---

## 디렉토리 구조 

```bash

|-- backend/        # 백엔드 서비스 (API, 비즈니스 로직)
|-- data-service/   # 데이터 처리·임베딩·벡터DB 인터페이스
|-- docs/           # 프로젝트 문서
|   |-- TIL/        # 팀원별 Today I Learned 기록
|   `-- handbook/   # 팀 규범 및 공식 가이드라인
|-- exec/           # 빌드·배포 실행 지침 및 방법 문서
|-- frontend/       # 프론트엔드 서비스 (UI, 웹앱)
`-- infrastructure/ # 인프라 정의 (IaC, CI/CD, 쿠버네티스 등)
```

---

## 📂 docs/

**역할**  
프로젝트 공식 문서 저장소.

---

### 📑 하위 구조
- **`TIL/`** : 팀원별 *Today I Learned*, 개인 기록  
- **`handbook/`** : 팀 규범·가이드라인 (예: `repo-guidelines.md`)

---

### 🔧 확장 예시
- **`architecture/`** : 시스템 아키텍처 다이어그램, ADR *(Architecture Decision Records)*  
- **`guides/`** : 개발 환경 세팅, 코드 스타일, 운영 지침  
- **`runbooks/`** : 장애 대응 매뉴얼  
- **`assets/`** : README/문서 삽화 이미지