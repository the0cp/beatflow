"use client"

import { useCallback } from "react"
import { isBlackKey, midiToNoteName } from "@/lib/music-types"
import { playNotePreview } from "@/lib/audio-engine"

interface PianoKeysProps {
  noteRange: [number, number]
  rowHeight: number
  activeTrackId: string
}

export function PianoKeys({
  noteRange,
  rowHeight,
  activeTrackId,
}: PianoKeysProps) {
  const [low, high] = noteRange
  const keys = []

  for (let midi = high; midi >= low; midi--) {
    keys.push(midi)
  }

  const handleClick = useCallback(
    (midi: number) => {
      playNotePreview(midi, activeTrackId)
    },
    [activeTrackId]
  )

  return (
    <div className="flex flex-col select-none shrink-0" style={{ width: 56 }}>
      {keys.map((midi) => {
        const black = isBlackKey(midi)
        const name = midiToNoteName(midi)
        const isC = midi % 12 === 0
        return (
          <div
            key={midi}
            className={`flex items-center justify-end pr-1.5 border-b cursor-pointer transition-colors text-[9px] font-mono ${
              black
                ? "bg-[hsl(220,18%,8%)] text-muted-foreground border-[hsl(var(--grid-line))] hover:bg-[hsl(220,18%,14%)]"
                : "bg-[hsl(220,18%,12%)] text-foreground border-[hsl(var(--grid-line))] hover:bg-[hsl(220,18%,18%)]"
            } ${isC ? "font-semibold text-[hsl(var(--primary))]" : ""}`}
            style={{ height: rowHeight, lineHeight: `${rowHeight}px` }}
            onMouseDown={() => handleClick(midi)}
          >
            {isC || black ? name : ""}
          </div>
        )
      })}
    </div>
  )
}
