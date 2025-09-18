from fastapi import FastAPI
from app.api import recommend

app = FastAPI()

# 라우터 등록
app.include_router(recommend.router, prefix="/api")
