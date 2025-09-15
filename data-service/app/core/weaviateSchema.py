from app.core.weaviateClient import get_client
from weaviate.classes.config import DataType, Configure
def init_schema():
    client = get_client()

    # 기존 스키마 초기화
    client.collections.delete_all()

    # Song 클래스 정의 (메타데이터)
    client.collections.create(
        name="Song",
        description="Song metadata and audio features",
        vectorizer_config=Configure.Vectorizer.none(),
        properties=[
            {"name": "song_id", "data_type": DataType.TEXT},
            {"name": "title", "data_type": DataType.TEXT},
            {"name": "artists", "data_type": DataType.TEXT_ARRAY},
            {"name": "album", "data_type": DataType.TEXT},
            {"name": "album_img_url", "data_type": DataType.TEXT},
            {"name": "level", "data_type": DataType.TEXT},
            {"name": "danceability", "data_type": DataType.NUMBER},
            {"name": "energy", "data_type": DataType.NUMBER},
            {"name": "key", "data_type": DataType.INT},
            {"name": "loudness", "data_type": DataType.NUMBER},
            {"name": "mode", "data_type": DataType.INT},
            {"name": "speechiness", "data_type": DataType.NUMBER},
            {"name": "acousticness", "data_type": DataType.NUMBER},
            {"name": "instrumentalness", "data_type": DataType.NUMBER},
            {"name": "liveness", "data_type": DataType.NUMBER},
            {"name": "valence", "data_type": DataType.NUMBER},
            {"name": "tempo", "data_type": DataType.NUMBER},
            {"name": "duration_ms", "data_type": DataType.INT},
            {"name": "lyrics", "data_type": DataType.TEXT},
            {"name": "popularity", "data_type": DataType.INT},
            {"name": "is_adult", "data_type": DataType.BOOL}, 
        ]
    )

    # LyricChunk 클래스 정의
    # client.collections.create(
    #     name="LyricChunk",
    #     description="Lyric chunks with embeddings",
    #     vectorizer_config=Configure.Vectorizer.none(),
    #     properties=[
    #         {"name": "lyric_id", "data_type": DataType.TEXT},
    #         {"name": "song_id", "data_type": DataType.TEXT},
    #         {"name": "chunk_idx", "data_type": DataType.INT},
    #         {"name": "start_ms", "data_type": DataType.INT},
    #         {"name": "words", "data_type": DataType.TEXT},
    #         {"name": "created_at", "data_type": DataType.DATE},
    #     ]
    # )

    print(" Schema initialized successfully!")
    client.close()

if __name__ == "__main__":
    init_schema()