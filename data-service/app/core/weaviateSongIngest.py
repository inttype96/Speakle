import pandas as pd
from app.core.weaviateClient import get_client

def safe_mode(value):
    if isinstance(value, str):
        val = value.strip().lower()
        if val == "major":
            return 1
        elif val == "minor":
            return 0
        else:
            return None
    try:
        return int(value)
    except (ValueError, TypeError):
        return None



def ingest_song_meta():
    client = get_client()
    song_col = client.collections.get("Song")

    # CSV 로드
    input_path = "data/clean_meta_en_with_popularity_with_adult_pop50.csv"
    df = pd.read_csv(input_path)
    print("로드된 meta 데이터:", df.shape)

    # Weaviate ingestion
    with song_col.batch.dynamic() as batch:
        for _, row in df.iterrows():
            properties = {
                "song_id": str(row["id"]),  
                "title": row.get("name"),
                "artists": [row["artists"]] if isinstance(row["artists"], str) else [],
                "album": row.get("album_name"),
                "album_img_url": row.get("album_img_url"),
                "level": row.get("level"),
                "danceability": row.get("danceability"),
                "energy": row.get("energy"),
                "key": safe_mode(row.get("key")) if not pd.isna(row["key"]) else None,
                "loudness": row.get("loudness"),
                "mode": safe_mode(row.get("mode")) if not pd.isna(row["mode"]) else None,
                "speechiness": row.get("speechiness"),
                "acousticness": row.get("acousticness"),
                "instrumentalness": row.get("instrumentalness"),
                "liveness": row.get("liveness"),
                "valence": row.get("valence"),
                "tempo": row.get("tempo"),
                "duration_ms": int(row["duration_ms"]) if not pd.isna(row["duration_ms"]) else None,
                "lyrics": row.get("lyrics"),
                "popularity": int(row["popularity"]) if not pd.isna(row["popularity"]) else None,
                "is_adult": bool(row["is_adult"]) if "is_adult" in row else False,
            }

            batch.add_object(
                properties=properties
            )

    print("Song metadata ingestion 완료")
    client.close()


if __name__ == "__main__":
    ingest_song_meta()
