#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

# Run the data ingestion scripts
echo "Initializing Weaviate schema..."
python -m app.core.weaviateSchema

echo "Ingesting song metadata..."
python -m app.core.weaviateSongIngest

echo "Ingesting lyric embeddings..."
python -m app.core.weaviateLyricIngest

echo "All ingestion scripts finished. Starting FastAPI server..."

# Start the FastAPI application
exec uvicorn main:app --host 0.0.0.0 --port 8081
