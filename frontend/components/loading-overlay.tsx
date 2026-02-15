"use client"

import { Loader2, Music2 } from "lucide-react"

interface LoadingOverlayProps {
  isLoading: boolean
}

export function LoadingOverlay({ isLoading }: LoadingOverlayProps) {
  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm transition-all duration-500">
      <div className="flex flex-col items-center gap-4 p-8 rounded-xl bg-card border shadow-xl animate-in fade-in zoom-in duration-300">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
          <div className="relative bg-background p-4 rounded-full border border-border">
            <Music2 className="h-8 w-8 text-primary animate-bounce" />
          </div>
        </div>
        
        <div className="flex flex-col items-center gap-2">
          <h3 className="text-lg font-semibold tracking-tight">Initializing Audio Engine</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading SoundFont...</span>
          </div>
        </div>
        
        <div className="h-1 w-32 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-primary animate-progress origin-left" style={{ width: '100%', animation: 'progress 2s infinite ease-in-out' }} />
        </div>
      </div>
      <style jsx global>{`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}