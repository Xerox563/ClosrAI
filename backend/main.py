from fastapi import FastAPI

app = FastAPI(title="SalesAgent AI API")

@app.get("/")
async def root():
    return {"message": "SalesAgent AI API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
