"use client"

import { create } from "zustand"
import { NoteEvent, MusicData, Track, DEFAULT_TRACKS, flattenMusicData, notesToMusicData } from "@/lib/music-types"
import { startPlayback, PlaybackController, preloadSounds, updatePlayhead, globalCurrentBeat } from "@/lib/audio-engine"

const MAX_HISTORY = 50

interface MusicState {
  notes: NoteEvent[]
  selectedNoteIds: Set<string>
  tracks: Track[]
  activeTrackId: string
  bpm: number
  snapValue: number
  tool: "select" | "draw" | "erase"
  isPlaying: boolean
  isGenerating: boolean
  hiddenTracks: Set<string>
  isAudioLoaded: boolean
  history: NoteEvent[][]
  historyIndex: number
  playbackController: PlaybackController | null

  initAudio: () => Promise<void>
  pushHistory: (newNotes: NoteEvent[]) => void
  setNotes: (notes: NoteEvent[]) => void
  setSelectedNoteIds: (ids: Set<string> | ((prev: Set<string>) => Set<string>)) => void
  setActiveTrackId: (id: string) => void
  setBpm: (bpm: number) => void
  setSnapValue: (val: number) => void
  setTool: (tool: "select" | "draw" | "erase") => void
  play: (startBeat?: number) => void
  stop: () => void
  seek: (beat: number) => void
  rewind: () => void
  generate: (prompt: string) => Promise<void>
  applyJson: (data: MusicData) => void
  toggleHidden: (id: string) => void
  toggleMute: (id: string) => void
  exportMidi: () => Promise<void>
  deleteSelected: () => void
  triggerUndo: () => void
  triggerRedo: () => void
  copySelected: () => void
  pasteSelected: () => void
  undo: () => void
  redo: () => void
}

export const useMusicStore = create<MusicState>((set, get) => ({
  notes: [],
  selectedNoteIds: new Set(),
  tracks: DEFAULT_TRACKS,
  activeTrackId: "t_piano",
  bpm: 120,
  snapValue: 0.25,
  tool: "draw",
  isPlaying: false,
  isGenerating: false,
  hiddenTracks: new Set(),
  isAudioLoaded: false,
  history: [[]],
  historyIndex: 0,
  playbackController: null,

  initAudio: async () => {
    await preloadSounds()
    set({ isAudioLoaded: true })
  },

  pushHistory: (newNotes) => {
    const { history, historyIndex } = get()
    const nextHistory = [...history.slice(0, historyIndex + 1), newNotes]
    set({
      history: nextHistory.slice(-MAX_HISTORY),
      historyIndex: Math.min(nextHistory.length - 1, MAX_HISTORY - 1)
    })
  },

  setNotes: (newNotes) => {
    set({ notes: newNotes })
    get().pushHistory(newNotes)
  },

  setSelectedNoteIds: (updater) => {
    set((state) => ({
      selectedNoteIds: typeof updater === "function" ? updater(state.selectedNoteIds) : updater
    }))
  },

  setActiveTrackId: (id) => set({ activeTrackId: id }),
  setBpm: (bpm) => set({ bpm }),
  setSnapValue: (snapValue) => set({ snapValue }),
  setTool: (tool) => set({ tool }),

  stop: () => {
    const { playbackController } = get()
    if (playbackController) {
      playbackController.stop()
    }
    set({ isPlaying: false, playbackController: null })
  },

  play: (startBeat) => {
    const state = get()
    state.stop()
    const start = startBeat ?? (globalCurrentBeat >= 0 ? globalCurrentBeat : 0)
    
    const mutedTrackIds = new Set(
      state.tracks.filter(t => t.muted).map(t => t.id)
    )
    state.hiddenTracks.forEach(id => mutedTrackIds.add(id))

    const controller = startPlayback(
      state.notes,
      state.bpm,
      start,
      () => {
        set({ isPlaying: false, playbackController: null })
        updatePlayhead(0)
      },
      mutedTrackIds
    )

    set({ isPlaying: true, playbackController: controller })
  },

  seek: (beat) => {
    const state = get()
    const wasPlaying = state.isPlaying
    if (wasPlaying) state.stop()
    updatePlayhead(beat)
    if (wasPlaying) {
      setTimeout(() => get().play(beat), 10)
    }
  },

  rewind: () => {
    get().stop()
    updatePlayhead(0)
  },

  undo: () => {
    const { historyIndex, history } = get()
    if (historyIndex > 0) {
      const idx = historyIndex - 1
      set({ historyIndex: idx, notes: history[idx] })
    }
  },

  redo: () => {
    const { historyIndex, history } = get()
    if (historyIndex < history.length - 1) {
      const idx = historyIndex + 1
      set({ historyIndex: idx, notes: history[idx] })
    }
  },

  generate: async (prompt) => {
    set({ isGenerating: true })
    try {
      const res = await fetch("/backend/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })
      const data: MusicData = await res.json()
      if (data.bpm) set({ bpm: data.bpm })
      if (data.tracks?.length) {
        set({ tracks: data.tracks, activeTrackId: data.tracks[0].id })
      }
      get().setNotes(flattenMusicData(data))
    } catch (err) {
      console.error(err)
    } finally {
      set({ isGenerating: false })
    }
  },

  applyJson: (data) => {
    if (data.bpm) set({ bpm: data.bpm })
    if (data.tracks) set({ tracks: data.tracks })
    get().setNotes(flattenMusicData(data))
  },

  toggleHidden: (id) => {
    set((state) => {
      const next = new Set(state.hiddenTracks)
      next.has(id) ? next.delete(id) : next.add(id)
      return { hiddenTracks: next }
    })
  },

  toggleMute: (id) => {
    set((state) => ({
      tracks: state.tracks.map(t => t.id === id ? { ...t, muted: !t.muted } : t)
    }))
  },

  exportMidi: async () => {
    const state = get()
    const currentMusicData = notesToMusicData(state.notes, state.bpm, state.tracks)
    try {
      const res = await fetch("/backend/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentMusicData),
      })
      if (!res.ok) throw new Error("Export failed")
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = "generated-music.mid"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
    }
  },

  deleteSelected: () => {
    const state = get()
    if (state.selectedNoteIds.size > 0) {
      state.setNotes(state.notes.filter(n => !state.selectedNoteIds.has(n.id)))
      set({ selectedNoteIds: new Set() })
    }
  },

  triggerUndo: () => get().undo(),
  triggerRedo: () => get().redo(),
  copySelected: () => {},
  pasteSelected: () => {}
}))