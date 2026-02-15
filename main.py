import uuid
import os
from fastapi import FastAPI, BackgroundTasks, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from services.llm_composer import generate_music_json
from services.midi_exporter import save_midi_file

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if not os.path.exists("static"):
    os.makedirs("static")

if os.path.exists("static/assets"):
    app.mount("/assets", StaticFiles(directory="static/assets"), name="assets")

app.mount("/static", StaticFiles(directory="static"), name="static")

class MusicRequest(BaseModel):
    prompt: str

@app.post("/api/generate")
async def generate(request: MusicRequest):
    try:
        print(f"Generating music for prompt: {request.prompt}")
        data = generate_music_json(request.prompt)
        return data
    except Exception as e:
        print(f"Error generating music: {e}")
        return {"error": str(e)}

@app.post("/api/export")
async def export_midi(request: Request, background_tasks: BackgroundTasks):
    try:
        music_data = await request.json()
        
        file_id = str(uuid.uuid4())
        filename = f"static/{file_id}.mid"
        
        print(f"Exporting MIDI to {filename}...")
        save_midi_file(music_data, filename)
        background_tasks.add_task(os.remove, filename)
        
        return FileResponse(
            path=filename,
            media_type="audio/midi",
            filename="generated-music.mid"
        )
    except Exception as e:
        print(f"Error exporting MIDI: {e}")
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/")
async def read_root():
    return FileResponse('static/index.html')

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)