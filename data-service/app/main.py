from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import recommend

app = FastAPI()

origins = [
    "https://localhost",
    "https://localhost:3000",
    "https://j13c104.p.ssafy.io",
    "http://backend:8080",
    "http://backend",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 라우터 등록
app.include_router(recommend.router, prefix="/api")
