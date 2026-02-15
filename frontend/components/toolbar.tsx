"use client"

import {
  MousePointer2,
  Pencil,
  Eraser,
  Play,
  Square,
  SkipBack,
  Download,
  Trash2,
  Copy,
  Clipboard,
  Undo2,
  Redo2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { SNAP_VALUES, Track, TRACK_COLORS } from "@/lib/music-types"

interface ToolbarProps {
  tool: "select" | "draw" | "erase"
  onToolChange: (tool: "select" | "draw" | "erase") => void
  snapValue: number
  onSnapChange: (value: number) => void
  isPlaying: boolean
  onPlay: () => void
  onStop: () => void
  onRewind: () => void
  bpm: number
  onBpmChange: (bpm: number) => void
  currentBeat: number
  tracks: Track[]
  activeTrackId: string
  onActiveTrackChange: (id: string) => void
  onExport: () => void
  onDelete: () => void
  onCopy: () => void
  onPaste: () => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
}

function ToolButton({
  active,
  onClick,
  children,
  label,
}: {
  active?: boolean
  onClick: () => void
  children: React.ReactNode
  label: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={active ? "default" : "ghost"}
          size="sm"
          className={`h-7 w-7 p-0 ${
            active
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="text-xs">{label}</p>
      </TooltipContent>
    </Tooltip>
  )
}

export function Toolbar({
  tool,
  onToolChange,
  snapValue,
  onSnapChange,
  isPlaying,
  onPlay,
  onStop,
  onRewind,
  bpm,
  onBpmChange,
  currentBeat,
  tracks,
  activeTrackId,
  onActiveTrackChange,
  onExport,
  onDelete,
  onCopy,
  onPaste,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: ToolbarProps) {
  const bar = Math.floor(currentBeat / 4) + 1
  const beat = Math.floor(currentBeat % 4) + 1
  const tick = Math.floor((currentBeat % 1) * 100)

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-2 px-3 py-1.5 bg-card border-b border-border">
        <div className="flex items-center gap-0.5">
          <ToolButton
            active={tool === "select"}
            onClick={() => onToolChange("select")}
            label="Select (V)"
          >
            <MousePointer2 className="h-3.5 w-3.5" />
          </ToolButton>
          <ToolButton
            active={tool === "draw"}
            onClick={() => onToolChange("draw")}
            label="Draw (D)"
          >
            <Pencil className="h-3.5 w-3.5" />
          </ToolButton>
          <ToolButton
            active={tool === "erase"}
            onClick={() => onToolChange("erase")}
            label="Erase (E)"
          >
            <Eraser className="h-3.5 w-3.5" />
          </ToolButton>
        </div>

        <Separator orientation="vertical" className="h-5" />

        <div className="flex items-center gap-0.5">
          <ToolButton onClick={onUndo} label="Undo (Ctrl+Z)" active={false}>
            <Undo2
              className={`h-3.5 w-3.5 ${
                canUndo ? "text-foreground" : "text-muted-foreground/40"
              }`}
            />
          </ToolButton>
          <ToolButton onClick={onRedo} label="Redo (Ctrl+Y)" active={false}>
            <Redo2
              className={`h-3.5 w-3.5 ${
                canRedo ? "text-foreground" : "text-muted-foreground/40"
              }`}
            />
          </ToolButton>
        </div>

        <Separator orientation="vertical" className="h-5" />

        <div className="flex items-center gap-0.5">
          <ToolButton onClick={onRewind} label="Rewind (Home)">
            <SkipBack className="h-3.5 w-3.5" />
          </ToolButton>
          {isPlaying ? (
            <ToolButton onClick={onStop} label="Stop (Space)">
              <Square className="h-3.5 w-3.5" />
            </ToolButton>
          ) : (
            <ToolButton onClick={onPlay} label="Play (Space)">
              <Play className="h-3.5 w-3.5" />
            </ToolButton>
          )}
        </div>

        <div className="font-mono text-xs text-muted-foreground tabular-nums bg-secondary px-2 py-0.5 rounded-sm min-w-[80px] text-center">
          {String(bar).padStart(3, "0")}:{String(beat).padStart(1, "0")}:
          {String(tick).padStart(2, "0")}
        </div>

        <Separator orientation="vertical" className="h-5" />

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            BPM
          </span>
          <input
            type="number"
            value={bpm}
            onChange={(e) => onBpmChange(Number(e.target.value))}
            className="w-12 h-6 bg-secondary text-foreground text-xs font-mono text-center rounded-sm border-none outline-none focus:ring-1 focus:ring-primary"
            min={40}
            max={300}
          />
        </div>

        <Separator orientation="vertical" className="h-5" />

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            Snap
          </span>
          <Select
            value={String(snapValue)}
            onValueChange={(v) => onSnapChange(Number(v))}
          >
            <SelectTrigger className="h-6 w-16 text-xs bg-secondary border-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SNAP_VALUES.map((s) => (
                <SelectItem key={s.value} value={String(s.value)}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator orientation="vertical" className="h-5" />

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            Track
          </span>
          <Select value={activeTrackId} onValueChange={onActiveTrackChange}>
            <SelectTrigger className="h-6 w-36 text-xs bg-secondary border-none">
              <div className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: TRACK_COLORS[activeTrackId] || "hsl(160, 80%, 48%)",
                  }}
                />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              {tracks.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: TRACK_COLORS[t.id] || "hsl(160, 80%, 48%)",
                      }}
                    />
                    {t.instrument}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-0.5">
          <ToolButton onClick={onCopy} label="Copy (Ctrl+C)">
            <Copy className="h-3.5 w-3.5" />
          </ToolButton>
          <ToolButton onClick={onPaste} label="Paste (Ctrl+V)">
            <Clipboard className="h-3.5 w-3.5" />
          </ToolButton>
          <ToolButton onClick={onDelete} label="Delete (Del)">
            <Trash2 className="h-3.5 w-3.5" />
          </ToolButton>
        </div>

        <Separator orientation="vertical" className="h-5" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={onExport}
            >
              <Download className="h-3.5 w-3.5" />
              MIDI
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">Export as MIDI file</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
