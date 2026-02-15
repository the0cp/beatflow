from mido import Message, MidiFile, MidiTrack, MetaMessage, bpm2tempo

def save_midi_file(data, filename="static/temp.mid"):
    mid = MidiFile()
    bpm = data.get("bpm", 100)
    
    track_map = {}
    main_track = MidiTrack()
    mid.tracks.append(main_track)
    main_track.append(MetaMessage('set_tempo', tempo=bpm2tempo(bpm)))
    
    channel_pool = [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15]
    chan_idx = 0

    for t in data.get("tracks", []):
        track = MidiTrack()
        mid.tracks.append(track)
        track.append(MetaMessage('track_name', name=t["instrument"]))
        
        name = t["instrument"].lower()
        
        if t["type"] == "percussion":
            curr_channel = 9
            program = 0
        else:
            curr_channel = channel_pool[chan_idx % len(channel_pool)]
            chan_idx += 1
            
            if "bass" in name: 
                if "slap" in name: program = 36
                elif "synth" in name: program = 38
                else: program = 33
            
            elif "guitar" in name:
                if "clean" in name: program = 27
                elif "overdrive" in name: program = 29
                else: program = 25
                
            elif "piano" in name or "keys" in name:
                program = 4 
                
            elif "sax" in name:
                program = 65
                
            elif "synth" in name:
                program = 81
                
            else: 
                program = 0

            track.append(Message('program_change', program=program, time=0, channel=curr_channel))
            
        track_map[t["id"]] = {"track": track, "channel": curr_channel}

    all_events = []
    ticks_per_beat = mid.ticks_per_beat
    
    for item in data.get("arrangement", []):
        info = track_map.get(item["track_id"])
        if not info: continue
        
        notes = data["clips"].get(item["clip_id"], [])
        section_start_beat = item["start_bar"] * 4.0
        
        for note in notes:
            abs_start = int((section_start_beat + float(note["start"])) * ticks_per_beat)
            abs_dur = int(float(note["duration"]) * ticks_per_beat)
            vel = int(note.get("velocity", 90))
            note_val = max(0, min(127, int(note["note"])))
            
            all_events.append({"time": abs_start, "type": "note_on", "note": note_val, "vel": vel, "track": info["track"], "ch": info["channel"]})
            all_events.append({"time": abs_start + abs_dur, "type": "note_off", "note": note_val, "vel": 0, "track": info["track"], "ch": info["channel"]})
            
    for info in track_map.values():
        tr = info["track"]
        ch_events = sorted([e for e in all_events if e["track"] == tr], key=lambda x: x["time"])
        last_time = 0
        for e in ch_events:
            delta = max(0, e["time"] - last_time)
            tr.append(Message(e["type"], note=e["note"], velocity=e["vel"], time=delta, channel=e["ch"]))
            last_time = e["time"]
            
    mid.save(filename)
    return filename