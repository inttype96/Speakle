import os
from dotenv import load_dotenv

load_dotenv()

WEAVIATE_HOST = os.getenv("WEAVIATE_HOST", "localhost")
WEAVIATE_PORT = int(os.getenv("WEAVIATE_PORT", "8082"))
WEAVIATE_GRPC_PORT = int(os.getenv("WEAVIATE_GRPC_PORT", "50051"))

#배포 환경
# WEAVIATE_HOST=weaviate   # 서비스 이름
# WEAVIATE_PORT=8080       # 컨테이너 내부 포트
# WEAVIATE_GRPC_PORT=50051
