import logging
import os
from fastapi import FastAPI, File, UploadFile, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    logger.info("Serving index page")
    return templates.TemplateResponse("index.html", {"request": request})

def format_size(size_in_bytes):
    """Convert size in bytes to KB or MB"""
    if size_in_bytes < 1024 * 1024:  # Less than 1 MB
        return f"{size_in_bytes / 1024:.2f} KB"
    else:
        return f"{size_in_bytes / (1024 * 1024):.2f} MB"

def remove_extension(filename):
    """Remove the file extension from the filename"""
    return os.path.splitext(filename)[0]

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    logger.info(f"Received file upload: {file.filename}")
    contents = await file.read()
    size_in_bytes = len(contents)
    formatted_size = format_size(size_in_bytes)
    logger.info(f"File size: {formatted_size}")
    logger.info(f"File content type: {file.content_type}")
    
    response = {
        "name": remove_extension(file.filename),
        "size": formatted_size,
        "type": file.content_type
    }
    logger.info(f"Sending response: {response}")
    return response

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)