export interface NoteEvent {
  id: string
  note: number
  start: number
  duration: number
  velocity: number
  track_id: string
}

export interface Track {
  id: string
  instrument: string
  type: "instrument" | "percussion"
  muted?: boolean
  solo?: boolean
  color?: string
}

export interface ArrangementItem {
  section: string
  start_bar: number
  track_id: string
  clip_id: string
}

export interface MusicData {
  bpm: number
  tracks: Track[]
  clips: Record<string, NoteEvent[]>
  arrangement: ArrangementItem[]
}

export interface PianoRollState {
  notes: NoteEvent[]
  selectedNoteIds: Set<string>
  scrollX: number
  scrollY: number
  zoomX: number
  zoomY: number
  snapValue: number
  tool: "select" | "draw" | "erase"
}

export const NOTE_NAMES = [
  "C", "C#", "D", "D#", "E", "F",
  "F#", "G", "G#", "A", "A#", "B",
] as const

export const TRACK_COLORS: Record<string, string> = {
  t_piano: "hsl(160, 80%, 48%)",
  t_bass: "hsl(200, 70%, 50%)",
  t_kick: "hsl(30, 80%, 55%)",
  t_snare: "hsl(340, 75%, 55%)",
  t_hat: "hsl(280, 65%, 60%)",
}

export function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1
  const noteName = NOTE_NAMES[midi % 12]
  return `${noteName}${octave}`
}

export function isBlackKey(midi: number): boolean {
  const n = midi % 12
  return [1, 3, 6, 8, 10].includes(n)
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10)
}

export function flattenMusicData(data: MusicData): NoteEvent[] {
  const notes: NoteEvent[] = []
  for (const item of data.arrangement) {
    const clip = data.clips[item.clip_id]
    if (!clip) continue
    const barOffset = item.start_bar * 4
    for (const note of clip) {
      notes.push({
        id: generateId(),
        note: note.note,
        start: note.start + barOffset,
        duration: note.duration,
        velocity: note.velocity,
        track_id: note.track_id,
      })
    }
  }
  return notes
}

export function notesToMusicData(
  notes: NoteEvent[],
  bpm: number,
  tracks: Track[]
): MusicData {
  const clipMap: Record<string, NoteEvent[]> = {}
  for (const track of tracks) {
    const trackNotes = notes
      .filter((n) => n.track_id === track.id)
      .map((n) => ({
        id: n.id,
        note: n.note,
        start: n.start,
        duration: n.duration,
        velocity: n.velocity,
        track_id: n.track_id,
      }))
    if (trackNotes.length > 0) {
      clipMap[`clip_${track.id}`] = trackNotes
    }
  }

  const arrangement: ArrangementItem[] = []
  for (const track of tracks) {
    const clipId = `clip_${track.id}`
    if (clipMap[clipId]) {
      arrangement.push({
        section: "Full",
        start_bar: 0,
        track_id: track.id,
        clip_id: clipId,
      })
    }
  }

  return { bpm, tracks, clips: clipMap, arrangement }
}

export const DEFAULT_TRACKS: Track[] = [
  { id: "t_piano", instrument: "Piano", type: "instrument" },
  { id: "t_bass", instrument: "Finger Bass", type: "instrument" },
  { id: "t_kick", instrument: "Kick", type: "percussion" },
  { id: "t_snare", instrument: "Snare", type: "percussion" },
  { id: "t_hat", instrument: "HiHat", type: "percussion" },
]

export const SNAP_VALUES = [
  { label: "1/1", value: 4 },
  { label: "1/2", value: 2 },
  { label: "1/4", value: 1 },
  { label: "1/8", value: 0.5 },
  { label: "1/16", value: 0.25 },
  { label: "1/32", value: 0.125 },
  { label: "Off", value: 0 },
]
