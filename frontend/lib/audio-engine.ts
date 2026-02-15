"use client"

import { NoteEvent } from "./music-types"

let audioContext: AudioContext | null = null
let sf2: any = null
let sfumatoModule: any = null

async function getSfumato() {
  if (sfumatoModule) return sfumatoModule
  sfumatoModule = await import("sfumato")
  return sfumatoModule
}

function getAudioContext(): AudioContext {
  if (!audioContext || audioContext.state === "closed") {
    audioContext = new AudioContext()
  }
  if (audioContext.state === "suspended") {
    audioContext.resume()
  }
  return audioContext
}

const TRACK_MAP: Record<string, { channel: number; program: number }> = {
  t_piano: { channel: 0, program: 0 },
  t_bass: { channel: 1, program: 32 },
  t_kick: { channel: 9, program: 0 },
  t_snare: { channel: 9, program: 0 },
  t_hat: { channel: 9, program: 0 },
}

const DRUM_NOTE_MAP: Record<string, number> = {
  t_kick: 36,
  t_snare: 38,
  t_hat: 42,
}

async function getSf2() {
  if (sf2) return sf2
  const { loadSoundfont } = await getSfumato()
  sf2 = await loadSoundfont("/ms.sf2")
  return sf2
}

function findPreset(sf: any, channel: number, program: number) {
  const bank = channel === 9 ? 128 : 0
  return sf.presets.find((p: any) => p.header.bank === bank && p.header.preset === program) || sf.presets[0]
}

export async function playNotePreview(midi: number, trackId: string) {
  const ctx = getAudioContext()
  const sf = await getSf2()
  const { startPresetNote } = await getSfumato()
  const config = TRACK_MAP[trackId] || TRACK_MAP.t_piano
  const pitch = config.channel === 9 ? (DRUM_NOTE_MAP[trackId] || 36) : midi
  const preset = findPreset(sf, config.channel, config.program)
  const stop = startPresetNote(ctx, preset, pitch, ctx.currentTime)
  stop(ctx.currentTime + 0.3)
}

export interface PlaybackController {
  stop: () => void
  isPlaying: () => boolean
  getCurrentBeat: () => number
}

export function startPlayback(
  notes: NoteEvent[],
  bpm: number,
  startBeat: number,
  onTick: (beat: number) => void,
  onEnd: () => void,
  mutedTracks?: Set<string>
): PlaybackController {
  const ctx = getAudioContext()
  const secPerBeat = 60 / bpm
  let stopped = false
  let intervalId: any = null
  const playbackStart = ctx.currentTime
  const scheduled = new Set<string>()
  const maxBeat = notes.reduce((max, n) => Math.max(max, n.start + n.duration), 0)

  Promise.all([getSf2(), getSfumato()]).then(([sf, { startPresetNote }]) => {
    intervalId = setInterval(() => {
      if (stopped) return
      const elapsed = ctx.currentTime - playbackStart
      const currentBeat = startBeat + elapsed / secPerBeat
      const ahead = ctx.currentTime + 0.15

      notes.forEach(n => {
        if (scheduled.has(n.id) || (mutedTracks && mutedTracks.has(n.track_id))) return
        const noteTime = playbackStart + (n.start - startBeat) * secPerBeat
        if (noteTime <= ahead && noteTime >= playbackStart - 0.05) {
          const config = TRACK_MAP[n.track_id] || TRACK_MAP.t_piano
          const pitch = config.channel === 9 ? (DRUM_NOTE_MAP[n.track_id] || 36) : n.note
          const preset = findPreset(sf, config.channel, config.program)
          
          const velocityGain = n.velocity / 127
          
          const validNoteTime = Math.max(0, noteTime)
          
          const stopHandle = startPresetNote(ctx, preset, pitch, validNoteTime, { gain: velocityGain })
          
          const releaseTime = 0.1
          stopHandle(noteTime + n.duration * secPerBeat + releaseTime)
          
          scheduled.add(n.id)
        }
      })

      onTick(currentBeat)
      if (currentBeat >= maxBeat + 0.5) {
        stopped = true
        clearInterval(intervalId)
        onEnd()
      }
    }, 25)
  })

  return {
    stop: () => {
      stopped = true
      if (intervalId) clearInterval(intervalId)
    },
    isPlaying: () => !stopped,
    getCurrentBeat: () => {
      const elapsed = ctx.currentTime - playbackStart
      return startBeat + elapsed / secPerBeat
    },
  }
}

export async function preloadSounds() {
  try {
    await Promise.all([getSfumato(), getSf2()])
    return true
  } catch (error) {
    console.error("Failed to load soundfont:", error)
    return false
  }
}