import os
import json
import random
from openai import OpenAI
from dotenv import load_dotenv
from services.music_engine import (
    parse_drum_grid, parse_harmonic_grid, parse_chord_comping
)

load_dotenv()
api_key = os.getenv("OPENROUTER_API_KEY")
base_url = os.getenv("LLM_BASE_URL")
model_name = os.getenv("LLM_MODEL")

client = OpenAI(base_url=base_url, api_key=api_key)
MODEL_NAME = model_name

STRUCTURE_PROMPT = """
You are a Senior Music Director.
Your Goal: Design a sophisticated song structure based on the user's request.

User Request: "{vibe}"
Key: {key}

Instructions:
1. **Analyze the Genre**: Determine the typical structure (e.g., Techno = Slow buildup; Pop = Verse/Chorus; Trap = Hook-centric).
2. **Chain of Loops**: Create a progression of short sections (2-4 bars) that evolve in energy.
3. **Harmony**: Choose chords that fit the genre's color (e.g., House = m7 chords; Neo-soul = m9/11).

Return JSON ONLY:
{{
  "bpm": 120,
  "key": "A Minor",
  "sections": [
    {{"name": "Intro", "length": 4, "energy": "Low", "texture": "Sparse", "chords": ["Am7"]}},
    {{"name": "Groove A", "length": 4, "energy": "Medium", "texture": "Steady", "chords": ["Am7", "D9"]}},
    {{"name": "Breakdown", "length": 2, "energy": "Low", "texture": "Atmospheric", "chords": ["Fmaj7"]}},
    {{"name": "Drop/Chorus", "length": 4, "energy": "High", "texture": "Busy", "chords": ["Am7", "G", "F", "Em7"]}}
  ]
}}
"""

PATTERN_PROMPT = """
You are a World-Class Rhythm Composer.
Task: Compose MIDI grids for section "{section}".

Context:
- **Genre/Vibe**: {vibe}
- **BPM**: {bpm}
- **Energy**: {energy}
- **Chords**: {chords}

**STEP 1: RHYTHMIC DNA ANALYSIS (Mental Sandbox)**
Before writing any grids, you must design the rhythm engine. Explain your choices in the "analysis" field:
1. **Kick & Snare Pattern**:
   - Is it "Four-on-the-floor" (House)? "Boom-Bap" (HipHop)? "Half-time" (Trap)?
   - Where does the Snare land? (2/4? Beat 3? Ghost notes?)
2. **Hi-Hat Subdivision**:
   - Do we use 8th notes (Steady)? 16th notes (Busy)? 
   - Do we need 32nd note rolls ('r') for Trap/Drill energy?
3. **Bassline Behavior**:
   - "Anchored": Long root notes (Pop/Ballad)?
   - "Pumping": Strictly off-beats (..1...1.) (Trance/House)?
   - "Walking/Grooving": Syncopated 16th notes (Funk/Fusion)?
4. **Chord/Keys Role**:
   - "Pads": Long sustains (Atmosphere)?
   - "Stabs": Rhythmic hits reacting to the Snare (House/Jazz)?
   - "Pulse": Staccato 8th notes (Rock/Synthwave)?

**STEP 2: GENERATE GRIDS**
Based on your analysis above, write the 16-step grids.

**Grid Legend (16 chars)**:
- Drums: 'x'=Hit, 'X'=Accent, 'g'=Ghost, 'r'=Roll(2), 'R'=Roll(3), '.'=Rest
- Bass: '1'/'5'=Notes, '-'=Sustain, '.'=Rest
- Keys: 'x'=Chord Hit, '-'=Sustain, '.'=Rest

**Constraint**: Your grids **MUST** match your analysis. Do not analyze "Steady Bass" and then write syncopated funk bass.

Return JSON ONLY:
{{
  "analysis": "Genre is Deep House (120 BPM). 1) Kick needs 4-on-the-floor. 2) Hats need open-hat on off-beats. 3) Bass MUST be 'pumping' on the off-beats to interact with the kick sidechain. 4) Keys will be short stabs on the 'and' of beats.",
  "groove": "straight",
  "kick_main":  "X...X...X...X...", 
  "kick_fill":  "X...X...X..XX...",
  "snare_main": "....X.......X...",
  "snare_fill": "....X...X...X...",
  "hihat_main": "..x...x...x...x.",
  "hihat_fill": "..x.r.x...x.x.x.",
  "bass_main":  "..1...1...1...1.", 
  "bass_fill":  "..1...1...3...5.",
  "keys_main":  "..x...x...x...x.",
  "keys_fill":  "x...x...x......."
}}
"""

def get_json(prompt, model=MODEL_NAME):
    messages = [
        {"role": "system", "content": "You are a JSON-only response bot."}, 
        {"role": "user", "content": prompt}
    ]
    try:
        resp = client.chat.completions.create(model=model, messages=messages, temperature=0.9, response_format={"type": "json_object"})
        content = resp.choices[0].message.content
        content = content.replace("```json", "").replace("```", "").strip()
        return json.loads(content)
    except Exception as e:
        print(f"LLM Error: {e}")
        return {}

def apply_random_spice(grid_str, probability=0.1):
    chars = list(grid_str)
    new_chars = chars.copy()
    for i in range(len(chars)):
        if chars[i] == '.' and random.random() < (probability * 0.3):
            if i % 4 != 0: new_chars[i] = 'g'
        elif chars[i] == 'x' and random.random() < probability:
            new_chars[i] = 'X' if random.random() > 0.5 else 'x'
    return "".join(new_chars)


def generate_section_clips(section_data, vibe, bpm, track_ids):
    sec_name = section_data.get("name", "Section")
    chords = section_data.get("chords", [])
    length = section_data.get("length", 2)
    energy = section_data.get("energy", "Medium")
    texture = section_data.get("texture", "Steady")
    
    prompt = PATTERN_PROMPT.format(
        section=sec_name, 
        vibe=vibe, 
        bpm=bpm, 
        energy=energy, 
        texture=texture, 
        chords=str(chords)
    )
    patterns = get_json(prompt)
    
    if not patterns: patterns = {}
    
    analysis = patterns.get("analysis", "No analysis provided.")
    groove_type = patterns.get("groove", "straight").lower()
    
    print(f"  > Thought: {analysis}")
    print(f"  > Groove: {groove_type} | BPM: {bpm}")

    clips = {"kick": [], "snare": [], "hat": [], "bass": [], "piano": []}
    
    for bar in range(length):
        offset = bar * 4.0
        is_fill_bar = (bar == length - 1)
        suffix = "_fill" if is_fill_bar else "_main"
        
        def get_grid(instr):
            grid = patterns.get(f"{instr}{suffix}")
            if not grid: grid = patterns.get(f"{instr}_main")
            if not grid: grid = patterns.get(instr) 
            return grid

        k_grid = get_grid("kick")
        if k_grid:
            if not is_fill_bar: k_grid = apply_random_spice(k_grid, 0.05)
            k = parse_drum_grid(k_grid, track_ids["kick"], 36, groove_type)
            for e in k: e["start"] += offset; clips["kick"].append(e)

        s_grid = get_grid("snare")
        if s_grid:
            if not is_fill_bar: s_grid = apply_random_spice(s_grid, 0.05)
            s = parse_drum_grid(s_grid, track_ids["snare"], 38, groove_type)
            for e in s: e["start"] += offset; clips["snare"].append(e)
            
        h_grid = get_grid("hihat")
        if not h_grid: h_grid = "x.x.x.x.x.x.x.x."
        if not is_fill_bar: h_grid = apply_random_spice(h_grid, 0.1)
        h = parse_drum_grid(h_grid, track_ids["hat"], 42, groove_type)
        for e in h: e["start"] += offset; clips["hat"].append(e)
            
        current_chord = chords[bar % len(chords)]
        
        b_grid = get_grid("bass")
        if b_grid:
            b = parse_harmonic_grid(b_grid, current_chord, "bass", track_ids["bass"], groove_type)
            for e in b: e["start"] += offset; clips["bass"].append(e)
            
        p_grid = get_grid("keys")
        if p_grid:
            p = parse_chord_comping(p_grid, current_chord, track_ids["piano"], groove_type)
            for e in p: e["start"] += offset; clips["piano"].append(e)
            
    return clips

def generate_music_json(user_prompt: str):
    print(f"request: {user_prompt}")
    
    bp_data = get_json(STRUCTURE_PROMPT.format(vibe=user_prompt, key="Random"))
    bpm = bp_data.get("bpm", 90)
    sections = bp_data.get("sections", [])
    
    if not sections:
        sections = [{"name": "Jam", "length": 4, "energy": "Medium", "chords": ["Cm7", "F9"]}]
        
    final_json = {
        "bpm": bpm,
        "tracks": [
            {"id": "t_piano", "instrument": "Electric Piano", "type": "instrument"},
            {"id": "t_bass", "instrument": "Finger Bass", "type": "instrument"},
            {"id": "t_kick", "instrument": "Kick", "type": "percussion"},
            {"id": "t_snare", "instrument": "Snare", "type": "percussion"},
            {"id": "t_hat", "instrument": "HiHat", "type": "percussion"},
        ],
        "clips": {},
        "arrangement": []
    }
    
    track_ids = {
        "piano": "t_piano", "bass": "t_bass", 
        "kick": "t_kick", "snare": "t_snare", "hat": "t_hat"
    }
    
    curr_bar = 0
    
    for i, sec in enumerate(sections):
        print(f"Composing Section {i+1}: {sec.get('name')}...")
        section_clips = generate_section_clips(sec, user_prompt, bpm, track_ids)
        
        for instr_name, events in section_clips.items():
            if not events: continue
            
            unique_id = f"s{i}_{sec.get('name')}_{instr_name}".replace(" ", "_")
            
            final_json["clips"][unique_id] = events
            final_json["arrangement"].append({
                "section": sec.get("name"),
                "start_bar": curr_bar,
                "track_id": track_ids[instr_name],
                "clip_id": unique_id
            })
            
        curr_bar += sec.get("length", 2)
        
    return final_json