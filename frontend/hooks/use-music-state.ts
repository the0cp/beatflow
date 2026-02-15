"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import {
  NoteEvent,
  MusicData,
  Track,
  DEFAULT_TRACKS,
  flattenMusicData,
  notesToMusicData,
} from "@/lib/music-types"
import { startPlayback, PlaybackController, preloadSounds } from "@/lib/audio-engine"

const MAX_HISTORY = 50

export function useMusicState() {
  const [notes, setNotes] = useState<NoteEvent[]>([])
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(new Set())
  const [tracks, setTracks] = useState<Track[]>(DEFAULT_TRACKS)
  const [activeTrackId, setActiveTrackId] = useState("t_piano")
  const [bpm, setBpm] = useState(120)
  const [snapValue, setSnapValue] = useState(0.25)
  const [tool, setTool] = useState<"select" | "draw" | "erase">("draw")
  const [isPlaying, setIsPlaying] = useState(false)
  const [playheadBeat, setPlayheadBeat] = useState(-1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [musicData, setMusicData] = useState<MusicData | null>(null)
  const [hiddenTracks, setHiddenTracks] = useState<Set<string>>(new Set())
  const [isAudioLoaded, setIsAudioLoaded] = useState(false)

  const playbackRef = useRef<PlaybackController | null>(null)
  const historyRef = useRef<NoteEvent[][]>([[]])
  const [historyIndex, setHistoryIndex] = useState(0)

  useEffect(() => {
    let mounted = true
    const init = async () => {
      await preloadSounds()
      if (mounted) {
        setIsAudioLoaded(true)
      }
    }
    init()
    return () => { mounted = false }
  }, [])

  const pushHistory = useCallback((newNotes: NoteEvent[]) => {
    const nextHistory = [...historyRef.current.slice(0, historyIndex + 1), newNotes]
    historyRef.current = nextHistory.slice(-MAX_HISTORY)
    setHistoryIndex(historyRef.current.length - 1)
  }, [historyIndex])

  const handleNotesChange = useCallback((newNotes: NoteEvent[]) => {
    setNotes(newNotes)
    pushHistory(newNotes)
  }, [pushHistory])

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const idx = historyIndex - 1
      setHistoryIndex(idx)
      setNotes(historyRef.current[idx])
    }
  }, [historyIndex])

  const redo = useCallback(() => {
    if (historyIndex < historyRef.current.length - 1) {
      const idx = historyIndex + 1
      setHistoryIndex(idx)
      setNotes(historyRef.current[idx])
    }
  }, [historyIndex])

  const stop = useCallback(() => {
    if (playbackRef.current) {
      playbackRef.current.stop()
      playbackRef.current = null
    }
    setIsPlaying(false)
  }, [])

  const seek = useCallback((beat: number) => {
    const wasPlaying = isPlaying
    if (wasPlaying) stop()
    setPlayheadBeat(beat)
    if (wasPlaying) {
      setTimeout(() => play(beat), 10)
    }
  }, [isPlaying, stop])

  const play = useCallback((startBeat?: number) => {
    stop()
    const start = startBeat ?? (playheadBeat >= 0 ? playheadBeat : 0)
    const filteredNotes = notes.filter((n) => !hiddenTracks.has(n.track_id))
    playbackRef.current = startPlayback(
      filteredNotes,
      bpm,
      start,
      (beat) => setPlayheadBeat(beat),
      () => {
        setIsPlaying(false)
        setPlayheadBeat(-1)
      }
    )
    setIsPlaying(true)
  }, [notes, bpm, playheadBeat, hiddenTracks, stop])

  const handleGenerate = useCallback(async (prompt: string) => {
    setIsGenerating(true)
    try {
      const res = await fetch("/backend/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })
      const data: MusicData = await res.json()
      setMusicData(data)
      setBpm(data.bpm || 120)
      if (data.tracks?.length) {
        setTracks(data.tracks)
        setActiveTrackId(data.tracks[0].id)
      }
      const flat = flattenMusicData(data)
      handleNotesChange(flat)
    } catch (err) {
      console.error(err)
    } finally {
      setIsGenerating(false)
    }
  }, [handleNotesChange])

  const currentMusicData = notesToMusicData(notes, bpm, tracks)

  const handleExportMidi = useCallback(async () => {
    try {
      const res = await fetch("/backend/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentMusicData),
      })
      
      if (!res.ok) {
        const errorText = await res.text()
        console.error("Export Error Status:", res.status, res.statusText)
        console.error("Export Error Body:", errorText)
        throw new Error(`Export failed: ${res.status} ${res.statusText} - ${errorText}`)
      }

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
      console.error("Failed to export MIDI:", err)
      alert(err instanceof Error ? err.message : "Export failed")
    }
  }, [currentMusicData])

  return {
    notes,
    selectedNoteIds,
    tracks,
    activeTrackId,
    bpm,
    snapValue,
    tool,
    isPlaying,
    playheadBeat,
    isGenerating,
    musicData: currentMusicData,
    hiddenTracks,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < historyRef.current.length - 1,
    isAudioLoaded,
    setNotes: handleNotesChange,
    setSelectedNoteIds,
    setActiveTrackId,
    setBpm,
    setSnapValue,
    setTool,
    play,
    stop,
    seek,
    rewind: () => { stop(); setPlayheadBeat(0) },
    generate: handleGenerate,
    applyJson: (data: MusicData) => {
      if (data.bpm) setBpm(data.bpm)
      if (data.tracks) setTracks(data.tracks)
      handleNotesChange(flattenMusicData(data))
    },
    toggleHidden: (id: string) => setHiddenTracks(prev => {
      const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next
    }),
    toggleMute: (id: string) => setTracks(prev => prev.map(t => t.id === id ? { ...t, muted: !t.muted } : t)),
    exportMidi: handleExportMidi
  }
}