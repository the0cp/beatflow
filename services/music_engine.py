import random
import re

INTERVALS = {
    "maj": [0, 4, 7],
    "min": [0, 3, 7],
    "dim": [0, 3, 6],
    "aug": [0, 4, 8],
    "sus2": [0, 2, 7],
    "sus4": [0, 5, 7],
    "7": [0, 4, 7, 10],
    "maj7": [0, 4, 7, 11],
    "min7": [0, 3, 7, 10],
    "m7b5": [0, 3, 6, 10],
    "dim7": [0, 3, 6, 9],
    "9": [0, 4, 7, 10, 14],
    "maj9": [0, 4, 7, 11, 14],
    "min9": [0, 3, 7, 10, 14],
    "11": [0, 7, 10, 14, 17],
    "13": [0, 4, 7, 10, 14, 21]
}

NOTE_MAP = {'C':0, 'C#':1, 'Db':1, 'D':2, 'D#':3, 'Eb':3, 'E':4, 'F':5, 
            'F#':6, 'Gb':6, 'G':7, 'G#':8, 'Ab':8, 'A':9, 'A#':10, 'Bb':10, 'B':11}

def parse_complex_chord(chord_name, default_octave=4):
    chord_name = chord_name.strip()
    
    root_match = re.match(r"^([A-G][#b]?)", chord_name)
    if not root_match:
        return [60, 64, 67]
    
    root_str = root_match.group(1)
    root_val = NOTE_MAP.get(root_str, 0)
    
    current_octave = default_octave
    if root_val >= 5: # F, F#, G, G#, A, A#, B
        current_octave -= 1
        
    root_midi = root_val + (current_octave + 1) * 12
    suffix = chord_name[len(root_str):]
    
    if suffix == "" or suffix == "5": quality = "maj"
    elif suffix == "m": quality = "min"
    elif suffix == "+": quality = "aug"
    elif "maj9" in suffix: quality = "maj9"
    elif "min9" in suffix or "m9" in suffix: quality = "min9"
    elif "maj7" in suffix: quality = "maj7"
    elif "min7" in suffix or "m7" in suffix: quality = "min7"
    elif "7" in suffix: quality = "7"
    elif "9" in suffix: quality = "9"
    elif "13" in suffix: quality = "13"
    elif "dim" in suffix: quality = "dim"
    elif "sus4" in suffix: quality = "sus4"
    else: quality = "maj" # Fallback
    
    intervals = INTERVALS.get(quality, INTERVALS["maj"])
    notes = [root_midi + i for i in intervals]
    
    final_notes = []
    
    for i, note in enumerate(notes):
        if i == 0: # Root
            final_notes.append(note - 12)
        elif note > root_midi + 12:
            final_notes.append(note) 
        else:
            final_notes.append(note)
            
    return sorted(final_notes)

def create_note_event(pitch, start, dur, velocity, track_id):
    return {"note": int(pitch), "start": start, "duration": dur, "velocity": int(velocity), "track_id": track_id}

def get_groove_offset(step_index, groove_type):
    offset = 0.0
    jitter = random.uniform(-0.005, 0.005)
    
    if groove_type == "swing":
        if step_index % 2 != 0: offset += 0.04
    elif groove_type == "heavy_swing" or groove_type == "shuffle":
        if step_index % 2 != 0: offset += 0.08
        
    elif groove_type == "drunk":
        offset += random.uniform(-0.02, 0.02)
        if step_index % 2 != 0: offset += 0.03
    elif groove_type == "laid_back":
        offset += 0.02 
        
    elif groove_type == "rushed":
        offset -= 0.01

    return offset + jitter

def parse_drum_grid(grid_str, track_id, midi_note, groove_type="straight"):
    events = []
    steps = list(grid_str)
    step_len = 0.25 
    
    for i, char in enumerate(steps):
        if char.lower() == '.': continue
        
        vel = 90
        if char == 'X': vel = 120
        elif char == 'x': vel = 100
        elif char == 'g': vel = 50
        
        timing_offset = get_groove_offset(i, groove_type)
        
        if groove_type == "drunk" and midi_note == 38: # Snare
            timing_offset += 0.03
            
        start_time = i * step_len + timing_offset
        if start_time < 0: start_time = 0
            
        events.append(create_note_event(midi_note, start_time, 0.1, vel, track_id))
        
    return events

def parse_harmonic_grid(grid_str, chord_name, instrument_type, track_id, groove_type="straight"):
    events = []
    chord_notes = parse_complex_chord(chord_name, default_octave=3)
    
    steps = list(grid_str)
    step_len = 0.25
    
    current_note = None
    current_start = 0
    current_dur = 0
    current_vel = 0
    
    def commit_note():
        nonlocal current_note, current_dur
        if current_note is not None:
            start_offset = get_groove_offset(int(current_start / step_len), groove_type)
            final_start = current_start + start_offset
            
            final_pitch = current_note
            if instrument_type == "bass":
                final_pitch -= 12
                if final_pitch < 36: final_pitch += 12
            
            events.append(create_note_event(final_pitch, final_start, current_dur * step_len, current_vel, track_id))
            current_note = None
            current_dur = 0

    for i, char in enumerate(steps):
        if char == '.': 
            commit_note()
        elif char == '-': 
            if current_note is not None:
                current_dur += 1
        else: 
            commit_note()
            
            target_idx = 0
            if char == '1': target_idx = 0
            elif char == '3': target_idx = 1
            elif char == '5': target_idx = 2
            elif char == '7': target_idx = 3
            elif char == '9': target_idx = 4
            
            if target_idx < len(chord_notes):
                current_note = chord_notes[target_idx]
            else:
                current_note = chord_notes[0]
            
            current_start = i * step_len
            current_dur = 1
            current_vel = random.randint(85, 105)
            
    commit_note()
    return events

def parse_chord_comping(grid_str, chord_name, track_id, groove_type="straight"):
    events = []
    chord_notes = parse_complex_chord(chord_name, default_octave=4)
    
    steps = list(grid_str)
    step_len = 0.25
    
    is_playing = False
    start_step = 0
    
    for i, char in enumerate(steps):
        if char.lower() == 'x': # Trigger
            if is_playing:
                dur = (i - start_step) * step_len
                offset = get_groove_offset(start_step, groove_type)
                for note in chord_notes:
                    events.append(create_note_event(note, start_step * step_len + offset, dur * 0.95, random.randint(80, 95), track_id))
            
            is_playing = True
            start_step = i
            
        elif char == '.': # Rest
            if is_playing:
                dur = (i - start_step) * step_len
                offset = get_groove_offset(start_step, groove_type)
                for note in chord_notes:
                    events.append(create_note_event(note, start_step * step_len + offset, dur * 0.95, random.randint(80, 95), track_id))
                is_playing = False
                
        elif char == '-': # Sustain
            pass 
            
    if is_playing:
        dur = (len(steps) - start_step) * step_len
        offset = get_groove_offset(start_step, groove_type)
        for note in chord_notes:
            events.append(create_note_event(note, start_step * step_len + offset, dur * 0.95, random.randint(80, 95), track_id))
            
    return events