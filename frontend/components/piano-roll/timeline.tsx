"use client"

import { useRef, useEffect, useCallback } from "react"
import { usePlayhead } from "@/hooks/use-playhead"

interface TimelineProps {
  totalBeats: number
  beatWidth: number
  onSeek: (beat: number) => void
}

export function Timeline({ totalBeats, beatWidth, onSeek }: TimelineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const height = 24
  const playheadBeat = usePlayhead()

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!ctx || !canvas) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = totalBeats * beatWidth * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    ctx.fillStyle = "hsl(220, 18%, 12%)"
    ctx.fillRect(0, 0, totalBeats * beatWidth, height)

    for (let i = 0; i <= totalBeats; i++) {
      const x = i * beatWidth
      const isBar = i % 4 === 0
      ctx.strokeStyle = isBar ? "hsl(220, 14%, 40%)" : "hsl(220, 14%, 25%)"
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x, isBar ? 0 : 12)
      ctx.lineTo(x, height)
      ctx.stroke()

      if (isBar) {
        ctx.fillStyle = "hsl(215, 12%, 60%)"
        ctx.font = "10px Inter, sans-serif"
        ctx.fillText(`${Math.floor(i / 4) + 1}`, x + 4, 10)
      }
    }

    if (playheadBeat >= 0) {
      const px = playheadBeat * beatWidth
      ctx.fillStyle = "hsl(0, 100%, 60%)"
      ctx.beginPath()
      ctx.moveTo(px - 6, 0)
      ctx.lineTo(px + 6, 0)
      ctx.lineTo(px, 8)
      ctx.fill()
    }
  }, [totalBeats, beatWidth, playheadBeat])

  useEffect(() => { draw() }, [draw])

  const handleInteraction = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const beat = (e.clientX - rect.left) / beatWidth
    onSeek(Math.max(0, beat))
  }

  return (
    <div className="h-6 border-b border-border select-none">
      <canvas 
        ref={canvasRef} 
        onMouseDown={handleInteraction} 
        onMouseMove={(e) => e.buttons === 1 && handleInteraction(e)}
        className="cursor-pointer" 
      />
    </div>
  )
}