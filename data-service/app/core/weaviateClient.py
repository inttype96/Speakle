import weaviate
from app.config import settings

def get_client():
    client = weaviate.connect_to_local(
        host=settings.WEAVIATE_HOST,
        port=settings.WEAVIATE_PORT,
        grpc_port=settings.WEAVIATE_GRPC_PORT
    )
    return client
