import os
import sys
import yaml
import base64
import asyncio
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from fastapi import FastAPI, Request, HTTPException, BackgroundTasks
from fastapi.responses import HTMLResponse, StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from loguru import logger
from pydantic import BaseModel

# Add local root to path
sys.path.append(str(Path(__file__).resolve().parent))

from src.libs.resume_and_cover_builder import ResumeFacade, ResumeGenerator, StyleManager
from src.resume_schemas.resume import Resume
from src.utils.chrome_utils import init_browser
from src.utils.constants import SECRETS_YAML, WORK_PREFERENCES_YAML, PLAIN_TEXT_RESUME_YAML
from main import ConfigValidator, FileManager

app = FastAPI(title="Search&Apply Web Dashboard", version="1.0.0")

# Setup static files and templates
os.makedirs("web/static", exist_ok=True)
os.makedirs("web/templates", exist_ok=True)
app.mount("/static", StaticFiles(directory="web/static"), name="static")
templates = Jinja2Templates(directory="web/templates")

# Live logging queue for SSE (Server-Sent Events)
log_queue = asyncio.Queue()
loop = asyncio.get_event_loop()

def log_sink(message):
    try:
        if loop.is_running():
            loop.call_soon_threadsafe(log_queue.put_nowait, str(message).strip())
    except Exception:
        pass

# Hook into loguru to capture CLI and Facade outputs
logger.add(log_sink, format="<green>{time:HH:mm:ss}</green> | <level>{level: <7}</level> | {message}", colorize=True)

# Thread pool for running the Selenium generation task asynchronously
thread_pool = ThreadPoolExecutor(max_workers=2)

class GenerateRequest(BaseModel):
    job_url: str
    style_name: str

class ProfileRequest(BaseModel):
    resume_yaml: str
    preferences_yaml: str
    secrets_yaml: str

@app.get("/", response_class=HTMLResponse)
async def read_dashboard(request: Request):
    return templates.TemplateResponse(request=request, name="index.html")

@app.get("/api/styles")
async def get_styles():
    try:
        style_manager = StyleManager()
        styles = style_manager.get_styles()
        # Return styles list format
        return [{"id": name, "name": name, "author": author_link} for name, (file_name, author_link) in styles.items()]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/profile")
async def get_profile():
    data_folder = Path("data_folder")
    try:
        resume_path = data_folder / PLAIN_TEXT_RESUME_YAML
        preferences_path = data_folder / WORK_PREFERENCES_YAML
        secrets_path = data_folder / SECRETS_YAML

        resume_content = resume_path.read_text(encoding="utf-8") if resume_path.exists() else ""
        preferences_content = preferences_path.read_text(encoding="utf-8") if preferences_path.exists() else ""
        secrets_content = secrets_path.read_text(encoding="utf-8") if secrets_path.exists() else ""

        return {
            "resume_yaml": resume_content,
            "preferences_yaml": preferences_content,
            "secrets_yaml": secrets_content
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/profile")
async def update_profile(profile: ProfileRequest):
    data_folder = Path("data_folder")
    try:
        resume_path = data_folder / PLAIN_TEXT_RESUME_YAML
        preferences_path = data_folder / WORK_PREFERENCES_YAML
        secrets_path = data_folder / SECRETS_YAML

        # Validate syntax by parsing them before writing
        yaml.safe_load(profile.resume_yaml)
        yaml.safe_load(profile.preferences_yaml)
        yaml.safe_load(profile.secrets_yaml)

        # Write to files
        resume_path.write_text(profile.resume_yaml, encoding="utf-8")
        preferences_path.write_text(profile.preferences_yaml, encoding="utf-8")
        secrets_path.write_text(profile.secrets_yaml, encoding="utf-8")

        logger.info("Successfully updated configurations in data_folder.")
        return {"status": "success", "message": "Profiles saved and validated."}
    except yaml.YAMLError as ye:
        raise HTTPException(status_code=400, detail=f"Invalid YAML Syntax: {ye}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/logs")
async def stream_logs():
    async def log_generator():
        # Yield a welcoming message
        yield f"data: 🚀 Logger stream connected to Search&Apply engine.\n\n"
        while True:
            log_msg = await log_queue.get()
            # Wrap as Server-Sent Event
            yield f"data: {log_msg}\n\n"
    return StreamingResponse(log_generator(), media_type="text/event-stream")

def run_generation_task(job_url: str, style_name: str) -> str:
    logger.info(f"Initiating background tailoring for URL: {job_url} with style: {style_name}")
    data_folder = Path("data_folder")
    
    # 1. Load files
    secrets_file, config_file, plain_text_resume_file, output_folder = FileManager.validate_data_folder(data_folder)
    config = ConfigValidator.validate_config(config_file)
    llm_api_key = ConfigValidator.validate_secrets(secrets_file)
    
    # Setup upload maps
    config["uploads"] = FileManager.get_uploads(plain_text_resume_file)
    config["outputFileDirectory"] = output_folder

    # 2. Extract plain text resume
    with open(config["uploads"]["plainTextResume"], "r", encoding="utf-8") as file:
        plain_text_resume = file.read()

    # 3. Setup style manager
    style_manager = StyleManager()
    style_manager.get_styles() # scans folder
    style_manager.set_selected_style(style_name)
    logger.info(f"Loaded style: {style_name}")

    # 4. Generate cover letter
    resume_generator = ResumeGenerator()
    resume_object = Resume(plain_text_resume)
    driver = init_browser()
    resume_generator.set_resume_object(resume_object)
    
    resume_facade = ResumeFacade(            
        api_key=llm_api_key,
        style_manager=style_manager,
        resume_generator=resume_generator,
        resume_object=resume_object,
        output_path=Path("data_folder/output"),
    )
    resume_facade.set_driver(driver)
    
    logger.info("Accessing job listing page via selenium driver...")
    resume_facade.link_to_job(job_url)
    
    logger.info("Job successfully parsed. Beginning cover letter synthesis via LLM...")
    result_base64, suggested_name = resume_facade.create_cover_letter()

    # 5. Decode Base64 to PDF
    pdf_data = base64.b64decode(result_base64)
    output_dir = Path(config["outputFileDirectory"]) / suggested_name
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / "cover_letter_tailored.pdf"
    
    with open(output_path, "wb") as file:
        file.write(pdf_data)

    logger.info(f"✅ Tailored Cover Letter successfully written to: {output_path}")
    return suggested_name

@app.post("/api/generate-cover-letter")
async def generate_cover_letter(payload: GenerateRequest):
    try:
        # Run in thread pool to avoid blocking FastAPI event loop
        loop = asyncio.get_event_loop()
        suggested_name = await loop.run_in_executor(thread_pool, run_generation_task, payload.job_url, payload.style_name)
        return {"status": "success", "file_id": suggested_name}
    except Exception as e:
        logger.error(f"Error during synthesis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/download/{file_id}")
async def download_pdf(file_id: str):
    data_folder = Path("data_folder")
    pdf_path = data_folder / "output" / file_id / "cover_letter_tailored.pdf"
    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail="Generated Cover Letter PDF not found.")
    return FileResponse(path=pdf_path, filename="cover_letter_tailored.pdf", media_type="application/pdf")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
