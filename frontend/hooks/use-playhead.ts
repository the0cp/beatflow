"use client"

import { useState, useEffect } from "react"
import { playheadEventTarget, globalCurrentBeat } from "@/lib/audio-engine"

export function usePlayhead() {
  const [beat, setBeat] = useState(globalCurrentBeat)

  useEffect(() => {
    const handleTick = (e: any) => setBeat(e.detail)
    playheadEventTarget.addEventListener('tick', handleTick)
    return () => playheadEventTarget.removeEventListener('tick', handleTick)
  }, [])

  return beat
}