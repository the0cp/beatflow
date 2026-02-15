"use client"

import { useState, useCallback, useEffect } from "react"
import { Check, AlertCircle, FileJson, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MusicData } from "@/lib/music-types"

interface JsonEditorProps {
  musicData: MusicData | null
  onApply: (data: MusicData) => void
}

export function JsonEditor({ musicData, onApply }: JsonEditorProps) {
  const [text, setText] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    if (musicData) {
      setText(JSON.stringify(musicData, null, 2))
      setIsDirty(false)
      setError(null)
    }
  }, [musicData])

  const handleChange = useCallback((value: string) => {
    setText(value)
    setIsDirty(true)
    try {
      JSON.parse(value)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  const handleApply = useCallback(() => {
    try {
      const parsed = JSON.parse(text) as MusicData
      if (!parsed.bpm || !parsed.tracks || !parsed.clips) {
        setError("Invalid music data structure")
        return
      }
      onApply(parsed)
      setIsDirty(false)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [text, onApply])

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <FileJson className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
            JSON Data
          </span>
        </div>
        <div className="flex items-center gap-1">
          {error && (
            <div className="flex items-center gap-1 text-destructive">
              <AlertCircle className="h-3 w-3" />
              <span className="text-xs">Error</span>
            </div>
          )}
          {isDirty && !error && (
            <div className="flex items-center gap-1 text-primary">
              <Check className="h-3 w-3" />
              <span className="text-xs">Valid</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs text-muted-foreground hover:text-foreground"
            onClick={handleApply}
            disabled={!!error || !isDirty}
          >
            <Upload className="h-3 w-3 mr-1" />
            Apply
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <textarea
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full h-full bg-background text-foreground text-xs font-mono p-3 resize-none outline-none border-none leading-relaxed"
          spellCheck={false}
        />
      </div>
      {error && (
        <div className="px-3 py-1.5 bg-destructive/10 border-t border-destructive/20">
          <p className="text-xs text-destructive font-mono truncate">{error}</p>
        </div>
      )}
    </div>
  )
}
