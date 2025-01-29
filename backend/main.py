from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def root():
    return {"message": "DNA Analysis API"}

@app.get("/health")
def health():
    return {"status": "healthy"}
