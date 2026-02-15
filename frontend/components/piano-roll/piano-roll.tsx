"use client"

import { useRef, useCallback, useEffect, useState } from "react"
import { NoteEvent } from "@/lib/music-types"
import { PianoKeys } from "./piano-keys"
import { NoteGrid } from "./note-grid"
import { VelocityEditor } from "./velocity-editor"
import { Timeline } from "./timeline"

interface PianoRollProps {
  notes: NoteEvent[]
  selectedNoteIds: Set<string>
  noteRange?: [number, number]
  beatWidth: number
  totalBeats: number
  snapValue: number
  tool: "select" | "draw" | "erase"
  playheadBeat: number
  activeTrackId: string
  onNotesChange: (notes: NoteEvent[]) => void
  onSelectionChange: (ids: Set<string>) => void
  onSeek: (beat: number) => void 
}

export function PianoRoll({
  notes,
  selectedNoteIds,
  noteRange = [24, 96],
  beatWidth: initialBeatWidth = 40,
  totalBeats: initialTotalBeats = 64,
  snapValue,
  tool,
  playheadBeat,
  activeTrackId,
  onNotesChange,
  onSelectionChange,
  onSeek,
}: PianoRollProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [rowHeight] = useState(24)
  const [beatWidth, setBeatWidth] = useState(initialBeatWidth)

  const maxBeat = Math.max(initialTotalBeats, ...notes.map(n => Math.ceil(n.start + n.duration + 4)))
  const totalBeats = Math.ceil(maxBeat / 4) * 4

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <div ref={scrollRef} className="flex-1 overflow-auto relative piano-roll-scroll">
        <div className="flex relative min-w-max min-h-full">
          <div className="sticky left-0 z-30 flex flex-col shrink-0 bg-background border-r border-border">
            <div className="sticky top-0 z-40 h-6 bg-background border-b border-border" />
            <PianoKeys noteRange={noteRange} rowHeight={rowHeight} activeTrackId={activeTrackId} />
            <div className="sticky bottom-0 z-40 h-20 bg-background border-t border-border" />
          </div>
          
          <div className="flex flex-col flex-1">
            <div className="sticky top-0 z-20 bg-background">
              <Timeline 
                totalBeats={totalBeats} 
                beatWidth={beatWidth} 
                playheadBeat={playheadBeat} 
                onSeek={onSeek} 
              />
            </div>
            
            <NoteGrid
              notes={notes}
              selectedNoteIds={selectedNoteIds}
              noteRange={noteRange}
              rowHeight={rowHeight}
              beatWidth={beatWidth}
              totalBeats={totalBeats}
              snapValue={snapValue}
              tool={tool}
              playheadBeat={playheadBeat}
              activeTrackId={activeTrackId}
              onNotesChange={onNotesChange}
              onSelectionChange={onSelectionChange}
            />

            <div className="sticky bottom-0 z-20 bg-background">
              <VelocityEditor
                notes={notes}
                selectedNoteIds={selectedNoteIds}
                beatWidth={beatWidth}
                totalBeats={totalBeats}
                onNotesChange={onNotesChange}
              />
            </div>
          </div>
        </div>
      </div>
      <style jsx global>{`
        .piano-roll-scroll::-webkit-scrollbar {
          width: 14px;
          height: 14px;
        }
        .piano-roll-scroll::-webkit-scrollbar-track {
          background: hsl(var(--secondary) / 0.3);
        }
        .piano-roll-scroll::-webkit-scrollbar-thumb {
          background-color: hsl(var(--muted-foreground) / 0.5);
          border: 2px solid transparent;
          background-clip: content-box;
          border-radius: 8px;
        }
        .piano-roll-scroll::-webkit-scrollbar-thumb:hover {
          background-color: hsl(var(--primary));
          border: 2px solid transparent;
        }
        .piano-roll-scroll::-webkit-scrollbar-corner {
          background: transparent;
        }
      `}</style>
    </div>
  )
}