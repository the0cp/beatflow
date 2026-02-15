"use client"

import {
  useRef,
  useEffect,
  useCallback,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react"
import {
  NoteEvent,
  isBlackKey,
  generateId,
  TRACK_COLORS,
} from "@/lib/music-types"
import { playNotePreview } from "@/lib/audio-engine"

interface NoteGridProps {
  notes: NoteEvent[]
  selectedNoteIds: Set<string>
  noteRange: [number, number]
  rowHeight: number
  beatWidth: number
  totalBeats: number
  snapValue: number
  tool: "select" | "draw" | "erase"
  playheadBeat: number
  activeTrackId: string
  onNotesChange: (notes: NoteEvent[]) => void
  onSelectionChange: (ids: Set<string>) => void
}

type DragState =
  | { type: "none" }
  | { type: "draw"; noteId: string; startX: number; tempNote: NoteEvent }
  | { type: "move"; offsetX: number; offsetY: number; startNotes: NoteEvent[]; currentDeltaB: number; currentDeltaM: number }
  | { type: "resize"; noteId: string; startNote: NoteEvent; currentDur: number }
  | { type: "marquee"; startX: number; startY: number; endX: number; endY: number }

export function NoteGrid({
  notes,
  selectedNoteIds,
  noteRange,
  rowHeight,
  beatWidth,
  totalBeats,
  snapValue,
  playheadBeat,
  activeTrackId,
  onNotesChange,
  onSelectionChange,
}: NoteGridProps) {
  const bgCanvasRef = useRef<HTMLCanvasElement>(null)
  const notesCanvasRef = useRef<HTMLCanvasElement>(null)
  const interactionCanvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState>({ type: "none" })
  const requestRef = useRef<number>()

  const [low, high] = noteRange
  const totalRows = high - low + 1
  const canvasWidth = totalBeats * beatWidth
  const canvasHeight = totalRows * rowHeight

  const snap = useCallback((v: number) => snapValue <= 0 ? v : Math.round(v / snapValue) * snapValue, [snapValue])
  const yToMidi = useCallback((y: number) => high - Math.floor(y / rowHeight), [high, rowHeight])
  const midiToY = useCallback((midi: number) => (high - midi) * rowHeight, [high, rowHeight])
  const xToBeat = useCallback((x: number) => x / beatWidth, [beatWidth])
  const beatToX = useCallback((beat: number) => beat * beatWidth, [beatWidth])

  const getNoteAt = useCallback((x: number, y: number) => {
    const beat = xToBeat(x), midi = yToMidi(y)
    return notes.findLast(n => n.track_id === activeTrackId && n.note === midi && beat >= n.start && beat <= n.start + n.duration) || null
  }, [notes, xToBeat, yToMidi, activeTrackId])

  useEffect(() => {
    const dpr = window.devicePixelRatio || 1
    const canvases = [bgCanvasRef.current, notesCanvasRef.current, interactionCanvasRef.current]
    canvases.forEach(c => {
      if (!c) return
      c.width = canvasWidth * dpr; c.height = canvasHeight * dpr
      c.style.width = `${canvasWidth}px`; c.style.height = `${canvasHeight}px`
      c.getContext("2d")?.scale(dpr, dpr)
    })
  }, [canvasWidth, canvasHeight])

  useEffect(() => {
    const ctx = bgCanvasRef.current?.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)
    for (let i = 0; i <= totalRows; i++) {
      const y = i * rowHeight
      ctx.fillStyle = isBlackKey(high - i) ? "hsl(220, 18%, 8%)" : "hsl(220, 18%, 10%)"
      ctx.fillRect(0, y, canvasWidth, rowHeight)
      ctx.strokeStyle = "hsl(220, 14%, 14%)"; ctx.lineWidth = 0.5
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvasWidth, y); ctx.stroke()
    }
    for (let i = 0; i <= totalBeats; i++) {
      const x = i * beatWidth, isBar = i % 4 === 0
      ctx.strokeStyle = isBar ? "hsl(220, 14%, 22%)" : "hsl(220, 14%, 14%)"
      ctx.lineWidth = isBar ? 1 : 0.5
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvasHeight); ctx.stroke()
      if (isBar) { ctx.fillStyle = "hsl(215, 12%, 35%)"; ctx.font = "9px monospace"; ctx.fillText(`${Math.floor(i / 4) + 1}`, x + 3, 10) }
    }
  }, [canvasWidth, canvasHeight, totalRows, high, rowHeight, beatWidth, totalBeats])

  const drawNotes = useCallback(() => {
    const ctx = notesCanvasRef.current?.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)
    const drag = dragRef.current
    const movingIds = new Set(drag.type === "move" ? drag.startNotes.map(n => n.id) : (drag.type === "resize" || drag.type === "draw" ? [drag.noteId] : []))

    for (const n of notes) {
      if (movingIds.has(n.id)) continue
      const x = beatToX(n.start), y = midiToY(n.note), w = n.duration * beatWidth, active = n.track_id === activeTrackId
      ctx.globalAlpha = active ? 0.85 : 0.15
      ctx.fillStyle = selectedNoteIds.has(n.id) ? "hsl(200, 70%, 55%)" : (TRACK_COLORS[n.track_id] || "gray")
      ctx.beginPath(); ctx.roundRect(x + 0.5, y + 1, Math.max(w - 1, 2), rowHeight - 2, 2); ctx.fill()
      if (active && selectedNoteIds.has(n.id)) { ctx.strokeStyle = "hsl(200, 90%, 70%)"; ctx.lineWidth = 1.5; ctx.stroke() }
    }
  }, [notes, selectedNoteIds, activeTrackId, canvasWidth, canvasHeight, beatToX, midiToY, beatWidth, rowHeight])

  useEffect(() => { drawNotes() }, [drawNotes])

  const renderInteraction = useCallback(() => {
    const ctx = interactionCanvasRef.current?.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)

    if (playheadBeat >= 0) {
      const px = beatToX(playheadBeat)
      ctx.strokeStyle = "white"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, canvasHeight); ctx.stroke()
    }

    const drag = dragRef.current
    const drawTempNote = (n: NoteEvent) => {
      const x = beatToX(n.start), y = midiToY(n.note), w = n.duration * beatWidth
      ctx.fillStyle = "hsl(200, 70%, 55%)"; ctx.globalAlpha = 0.9
      ctx.beginPath(); ctx.roundRect(x + 0.5, y + 1, Math.max(w - 1, 2), rowHeight - 2, 2); ctx.fill()
    }

    if (drag.type === "draw") drawTempNote(drag.tempNote)
    if (drag.type === "resize") {
      const orig = notes.find(n => n.id === drag.noteId)
      if (orig) drawTempNote({ ...orig, duration: drag.currentDur })
    }
    if (drag.type === "move") {
      drag.startNotes.forEach(n => drawTempNote({ 
        ...n, 
        start: Math.max(0, n.start + drag.currentDeltaB), 
        note: Math.max(low, Math.min(high, n.note + drag.currentDeltaM)) 
      }))
    }
    if (drag.type === "marquee") {
      ctx.strokeStyle = "hsl(200, 70%, 55%)"; ctx.setLineDash([4, 4])
      ctx.strokeRect(Math.min(drag.startX, drag.endX), Math.min(drag.startY, drag.endY), Math.abs(drag.endX - drag.startX), Math.abs(drag.endY - drag.startY))
    }
    requestRef.current = requestAnimationFrame(renderInteraction)
  }, [playheadBeat, canvasWidth, canvasHeight, beatToX, notes, low, high, midiToY, beatWidth, rowHeight])

  useEffect(() => {
    requestRef.current = requestAnimationFrame(renderInteraction)
    return () => cancelAnimationFrame(requestRef.current!)
  }, [renderInteraction])

  const getCanvasPos = (e: ReactMouseEvent) => {
    const rect = interactionCanvasRef.current?.getBoundingClientRect()
    return { x: e.clientX - (rect?.left || 0), y: e.clientY - (rect?.top || 0) }
  }

  const handleMouseDown = (e: ReactMouseEvent) => {
    e.preventDefault()
    const { x, y } = getCanvasPos(e), beat = xToBeat(x), midi = yToMidi(y), noteAt = getNoteAt(x, y)

    if (e.button === 2) {
      if (noteAt) onNotesChange(notes.filter(n => n.id !== noteAt.id))
      return
    }

    if (noteAt) {
      const isEdge = Math.abs(x - beatToX(noteAt.start + noteAt.duration)) < 6
      if (isEdge) {
        dragRef.current = { type: "resize", noteId: noteAt.id, startNote: noteAt, currentDur: noteAt.duration }
      } else {
        const sel = selectedNoteIds.has(noteAt.id) ? selectedNoteIds : new Set([noteAt.id])
        if (!selectedNoteIds.has(noteAt.id)) onSelectionChange(sel)
        dragRef.current = { type: "move", offsetX: beat - noteAt.start, offsetY: midi - noteAt.note, startNotes: notes.filter(n => sel.has(n.id)), currentDeltaB: 0, currentDeltaM: 0 }
      }
    } else {
      const snapped = snap(beat)
      const newNote = { id: generateId(), note: midi, start: snapped, duration: snapValue || 0.25, velocity: 90, track_id: activeTrackId }
      playNotePreview(midi, activeTrackId)
      dragRef.current = { type: "draw", noteId: newNote.id, startX: x, tempNote: newNote }
      onSelectionChange(new Set([newNote.id]))
    }
    drawNotes()
  }

  const handleMouseMove = (e: ReactMouseEvent) => {
    const { x, y } = getCanvasPos(e), drag = dragRef.current
    if (drag.type === "draw") {
      drag.tempNote = { ...drag.tempNote, duration: Math.max(snap(xToBeat(x) - xToBeat(drag.startX)), snapValue || 0.125) }
    } else if (drag.type === "move") {
      drag.currentDeltaB = snap(xToBeat(x) - drag.offsetX) - drag.startNotes[0].start
      drag.currentDeltaM = yToMidi(y) - drag.offsetY - drag.startNotes[0].note
    } else if (drag.type === "resize") {
      drag.currentDur = Math.max(snapValue || 0.125, snap(xToBeat(x)) - drag.startNote.start)
    } else if (drag.type === "marquee") {
      drag.endX = x; drag.endY = y
    }
  }

  const handleMouseUp = () => {
    const drag = dragRef.current
    if (drag.type === "draw") {
      onNotesChange([...notes, drag.tempNote])
    } else if (drag.type === "move") {
      onNotesChange(notes.map(n => {
        const o = drag.startNotes.find(s => s.id === n.id)
        return o ? { ...n, start: Math.max(0, o.start + drag.currentDeltaB), note: Math.max(low, Math.min(high, o.note + drag.currentDeltaM)) } : n
      }))
    } else if (drag.type === "resize") {
      onNotesChange(notes.map(n => n.id === drag.noteId ? { ...n, duration: drag.currentDur } : n))
    }
    dragRef.current = { type: "none" }
    drawNotes()
  }

  return (
    <div ref={containerRef} className="relative overflow-auto flex-1" onContextMenu={e => e.preventDefault()}>
      <canvas ref={bgCanvasRef} className="absolute inset-0" />
      <canvas ref={notesCanvasRef} className="absolute inset-0" />
      <canvas ref={interactionCanvasRef} className="absolute inset-0" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} />
    </div>
  )
}