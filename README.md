# BeatFlow: AI Full Arrangement Generator

<img width="2557" height="1300" alt="9b599bf11155d10245da0f04d55e6f33" src="https://github.com/user-attachments/assets/45b009ff-c283-41fd-a875-04fbf933aa02" />

BeatFlow is an LLM-powered music prototyping tool. Enter a prompt and it generates multi-track MIDI arrangements (chords, bass, drums). It features a full in-browser Piano Roll for editing, playback, and direct MIDI export to your DAW.

BeatFlow is not an MP3 generator. It utilizes the LLM as a Music Director capable of genuine music theory reasoning. Instead of predicting waveforms, the LLM architects a complete musical structure—planning sections, energy curves, and harmonic progressions—before composing. The output is a fully editable, structurally coherent MIDI arrangement.


- Includes a fully functional web-based Piano Roll editor.
- Export standard MIDI files to drop directly into Ableton Live, FL Studio, or Logic Pro.
- Uses LLMs to understand music theory, generating structured sections (Intro, Groove, Breakdown) rather than random notes.

## Quick Deployment

The project is split into a Frontend (Next.js) and Backend (FastAPI).

- Python 3.10+
- Node.js 18+ (pnpm recommended)

### Backend Setup (Python/FastAPI)

```bash
cd beatflow
pip install -r requirements.txt
```

Configure Environment:

Create a `.env` file and add:

```text
OPENROUTER_API_KEY=your_key
LLM_BASE_URL=https://openrouter.ai/api/v1 # (or other OpenAI-compatible endpoint)
LLM_MODEL=your_model_name # (e.g., gpt-4o, gemini-3-pro)

# Optional proxy settings
HTTP_PROXY=
HTTPS_PROXY=
```

Start server:

```bash
python main.py
```

### Frontend Setup (Next.js)

```bash
cd frontend
pnpm install
pnpm dev
```

Open `http://localhost:3000` to start creating.


