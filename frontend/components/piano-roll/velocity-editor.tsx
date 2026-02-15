"use client"

import { useRef, useEffect, useCallback, useState } from "react"
import { NoteEvent } from "@/lib/music-types"

interface VelocityEditorProps {
  notes: NoteEvent[]
  selectedNoteIds: Set<string>
  beatWidth: number
  totalBeats: number
  onNotesChange: (notes: NoteEvent[]) => void
}

export function VelocityEditor({
  notes,
  selectedNoteIds,
  beatWidth,
  totalBeats,
  onNotesChange,
}: VelocityEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dragInfo = useRef<{ noteId: string; initialVel: number } | null>(null)
  const height = 80
  const animationRef = useRef<number>()

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!ctx || !canvas) return

    const dpr = window.devicePixelRatio || 1
    if (canvas.width !== totalBeats * beatWidth * dpr) {
      canvas.width = totalBeats * beatWidth * dpr
      canvas.height = height * dpr
      ctx.scale(dpr, dpr)
    }

    ctx.clearRect(0, 0, canvas.width, height)

    for (const note of notes) {
      const x = note.start * beatWidth + (note.duration * beatWidth) / 2
      const isSelected = selectedNoteIds.has(note.id)
      const isEditing = dragInfo.current?.noteId === note.id
      
      const vHeight = (note.velocity / 127) * (height - 20)
      const topY = height - vHeight - 10

      ctx.strokeStyle = isSelected || isEditing ? "hsl(200, 90%, 70%)" : "hsl(220, 14%, 30%)"
      ctx.lineWidth = isEditing ? 2 : 1
      ctx.beginPath()
      ctx.moveTo(x, height)
      ctx.lineTo(x, topY)
      ctx.stroke()

      ctx.fillStyle = isSelected || isEditing ? "hsl(200, 70%, 55%)" : "hsl(220, 14%, 45%)"
      ctx.beginPath()
      ctx.arc(x, topY, isEditing ? 3.5 : 2.5, 0, Math.PI * 2)
      ctx.fill()
    }
    
    animationRef.current = requestAnimationFrame(draw)
  }, [notes, selectedNoteIds, beatWidth, totalBeats])

  useEffect(() => {
    animationRef.current = requestAnimationFrame(draw)
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [draw])

  const calculateVelocity = (y: number) => {
    return Math.max(1, Math.min(127, Math.round(((height - y - 10) / (height - 20)) * 127)))
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const beat = x / beatWidth

    const noteAt = notes.find(n => Math.abs(n.start + n.duration / 2 - beat) < 0.3)
    
    if (noteAt) {
      dragInfo.current = { noteId: noteAt.id, initialVel: noteAt.velocity }
      const newVel = calculateVelocity(y)
      noteAt.velocity = newVel 
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragInfo.current || !canvasRef.current) return
    
    const rect = canvasRef.current.getBoundingClientRect()
    const y = e.clientY - rect.top
    const newVel = calculateVelocity(y)

    const note = notes.find(n => n.id === dragInfo.current!.noteId)
    if (note) {
      note.velocity = newVel
    }
  }

  const handleMouseUp = () => {
    if (dragInfo.current) {
      onNotesChange([...notes])
      dragInfo.current = null
    }
  }

  return (
    <div className="h-20 border-t border-border bg-background/50 overflow-hidden">
      <canvas 
        ref={canvasRef} 
        onMouseDown={handleMouseDown} 
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="cursor-ns-resize touch-none" 
      />
    </div>
  )
}