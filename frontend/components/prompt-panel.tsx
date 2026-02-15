"use client"

import { useState } from "react"
import { Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface PromptPanelProps {
  onGenerate: (prompt: string) => void
  isGenerating: boolean
}

const EXAMPLE_PROMPTS = [
  "Chill lo-fi hip hop beat with jazzy chords",
  "Aggressive trap beat",
  "Upbeat synthwave retro track",
  "Smooth neo-soul groove",
  "Minimal deep house 4-on-the-floor",
  "Melancholic piano ballad",
]

export function PromptPanel({ onGenerate, isGenerating }: PromptPanelProps) {
  const [prompt, setPrompt] = useState("")

  const handleSubmit = () => {
    if (!prompt.trim() || isGenerating) return
    onGenerate(prompt.trim())
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
          AI Generator
        </h3>
      </div>

      <Textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe the beat you want to generate..."
        className="min-h-[80px] text-xs bg-secondary border-border resize-none focus:ring-primary"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            handleSubmit()
          }
        }}
      />

      <Button
        onClick={handleSubmit}
        disabled={!prompt.trim() || isGenerating}
        className="w-full h-8 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="mr-1.5 h-3 w-3" />
            Generate Beats
          </>
        )}
      </Button>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">
          Examples
        </span>
        <div className="flex flex-wrap gap-1">
          {EXAMPLE_PROMPTS.map((ex) => (
            <button
              key={ex}
              onClick={() => setPrompt(ex)}
              className="text-xs px-2 py-0.5 rounded-sm bg-secondary text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
