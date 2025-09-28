# README.md
## 빌드 및 배포
### 버전
- Backend
    - JDK 17.0.15(Temurin-17.0.15+6)
    - Spring Boot 3.3.3
    - Gradle 8.5
    - PostgreSQL 15 LTS
    - Redis 8.2.1
    - Python 3.11.9
- Frontend
    - Node 22.15.0
    - NPM 11.4.2
    - React 19.1.1
    - Tailwindcss 4.1.13
    - TypeScript 5.8.3
    - Zustand 5.0.8
- AI / Data
    - Weaviate 1.24.12
    - FastAPI 0.116.1
- DevOps
    - Nginx Proxy Manager 2.12.6
    - Docker 28.4.0
    - Portainer 2.33.1 LTS
    - Netdata 2.7.0
    - Jenkins 2.516.2-1

### 환경 변수
    ```markdown
    # Backend
    # ==========================================
    # 애플리케이션 환경 설정
    # ==========================================
    SPRING_PROFILES_ACTIVE=prod

    # ==========================================
    # 데이터베이스 설정 (PostgreSQL)
    # ==========================================
    DB_URL=jdbc:postgresql://postgres:5432/your_database_name
    DB_USERNAME=your_db_username
    DB_PASSWORD=your_db_password

    # for docker-compose
    POSTGRES_DB=
    POSTGRES_USER=
    POSTGRES_PASSWORD=

    # ==========================================
    # Redis 설정
    # ==========================================
    REDIS_HOST=redis
    REDIS_PORT=6379
    # REDIS_PASSWORD=your_redis_password_if_needed

    # ==========================================
    # JWT 설정
    # ==========================================
    # 512비트 이상의 랜덤 키 필요 (openssl rand -hex 64 명령어로 생성 가능)
    JWT_SECRET=your_jwt_secret_key_minimum_64_bytes_recommended_512_bits
    JWT_ACCESS_EXPIRATION=3600
    JWT_REFRESH_EXPIRATION=2592000

    # ==========================================
    # Spotify API 설정
    # ==========================================
    # Spotify Developer Dashboard에서 발급받은 클라이언트 정보
    SPOTIFY_CLIENT_ID=your_spotify_client_id
    SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
    SPOTIFY_REDIRECT_URI=
    SPOTIFY_SCOPES="streaming user-read-email user-read-playback-state user-modify-playback-state"
    SPOTIFY_POST_LOGIN_REDIRECT=https://your-frontend-domain.com/after-login

    # ==========================================
    # 암호화 설정
    # ==========================================
    # 32자리 랜덤 문자열 (AES-256 암호화용)
    APP_CRYPTO_SECRET_KEY=your_32_character_encryption_key

    # ==========================================
    # 개발/디버그 설정
    # ==========================================
    DEBUG_MODE=false

    # ==========================================
    # ETRI API 설정
    # ==========================================
    etri.api.key=

    # ==========================================
    # GMS 설정
    # ==========================================
    GMS_URL=
    GMS_KEY=

    # ==========================================
    # Fast API 설정
    # ==========================================
    FASTAPI_URL=
    FASTAPI_RANDOM_URL=

    # ==========================================
    # Mail Server
    # ==========================================
    SENDER_USER=
    SENDER_PW=

    # ==========================================
    # OpenAPI Weather
    # ==========================================
    WEATHER_KEY=
    WEATHER_URL=
    ```

### 배포 시 특이사항
    - 젠킨스 자동 빌드 시 EC2 `~/`디렉토리의 `deploy.sh`를 실행시켜 빌드하는 구조임
        ```bash
        #!/bin/bash
        set -e

        # .env 복사
        cp -f ~/.env ~/webserver/speakle/.env

        # 앱 디렉토리 이동
        cd ~/webserver/speakle

        # Docker Compose 빌드 및 실행
        sudo docker compose up -d --build
        ```
    - 젠킨스 볼륨 마운트된 데이터는 `~/webserver/speakle/`내에 존재함
    - Weaviate의 램 점유율이 높아 스왑 메모리 생성 권장
    - 배포 시 PSQL에 덤프 파일을 넣는 사전 작업이 필요함
        1. EC2에 덤프 파일 복사
        2. `sudo docker cp songs.sql postgres:/tmp/songs.sql`
        3. `sudo docker cp songs_lyrics.sql postgres:/tmp/songs_lyrics.sql`
        4. `sudo docker exec -i postgres psql -U postgres -d speakle -f /tmp/songs.sql`
        5. `sudo docker exec -i postgres psql -U postgres -d speakle -f /tmp/songs_lyrics.sql`
    - 배포 시 Weaviate 또한 덤프 파일을 넣는 사전 작업이 필요함
        1. EC2에 덤프 파일 복사
        2. `sudo cp -r weaviate_data/ webserver/spaekle/`

### DB 접속 정보
    - PostgresSQL
        - DB: speakle
        - ID: postgres
        - PW: ssafy
    - Redis
        - Host: redis

## 외부 서비스 정보
    - Spotify
        - 해당 서비스가 제공하는 API를 이용하여 OAuth 연동 및 Web Player를 제어함
        - 제약사항
            - 한 URL에 대해 화이트리스트 형식으로 등록된 이용자만 호출 가능하며, 최대인원 25명임
    - OpenWeatherMap
        - 해당 서비스가 제공하는 API를 이용하여 날씨 정보를 가져옴