"use client"

import { memo } from "react"
import { Volume2, VolumeX, Eye, EyeOff } from "lucide-react"
import { TRACK_COLORS } from "@/lib/music-types"
import { Button } from "@/components/ui/button"
import { useMusicStore } from "@/hooks/use-music-state"

export const TrackList = memo(function TrackList() {
  const tracks = useMusicStore(s => s.tracks)
  const activeTrackId = useMusicStore(s => s.activeTrackId)
  const notes = useMusicStore(s => s.notes)
  const hiddenTracks = useMusicStore(s => s.hiddenTracks)
  const onActiveTrackChange = useMusicStore(s => s.setActiveTrackId)
  const onToggleHidden = useMusicStore(s => s.toggleHidden)
  const onToggleMute = useMusicStore(s => s.toggleMute)

  return (
    <div className="flex flex-col gap-0.5 p-2">
      <span className="text-xs text-muted-foreground uppercase tracking-wider px-1 mb-1">
        Tracks
      </span>
      {tracks.map((track) => {
        const count = notes.filter((n) => n.track_id === track.id).length
        const isActive = track.id === activeTrackId
        const isHidden = hiddenTracks.has(track.id)
        const color = TRACK_COLORS[track.id] || "hsl(160, 80%, 48%)"

        return (
          <div
            key={track.id}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-sm cursor-pointer transition-colors ${
              isActive
                ? "bg-secondary"
                : "hover:bg-secondary/50"
            }`}
            onClick={() => onActiveTrackChange(track.id)}
          >
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: color, opacity: isHidden ? 0.3 : 1 }}
            />
            <div className="flex flex-col flex-1 min-w-0">
              <span
                className={`text-xs truncate ${
                  isActive ? "text-foreground font-medium" : "text-muted-foreground"
                }`}
              >
                {track.instrument}
              </span>
              <span className="text-xs text-muted-foreground/60">
                {count} notes
              </span>
            </div>
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleHidden(track.id)
                }}
              >
                {isHidden ? (
                  <EyeOff className="h-3 w-3" />
                ) : (
                  <Eye className="h-3 w-3" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleMute(track.id)
                }}
              >
                {track.muted ? (
                  <VolumeX className="h-3 w-3 text-destructive" />
                ) : (
                  <Volume2 className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
})