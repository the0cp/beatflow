"use client"

import { useEffect, useMemo } from "react"
import { PianoRoll } from "@/components/piano-roll/piano-roll"
import { Toolbar } from "@/components/toolbar"
import { TrackList } from "@/components/track-list"
import { PromptPanel } from "@/components/prompt-panel"
import { JsonEditor } from "@/components/json-editor"
import { LoadingOverlay } from "@/components/loading-overlay"
import { useMusicStore } from "@/hooks/use-music-state"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Music4 } from "lucide-react"
import { notesToMusicData } from "@/lib/music-types"

export default function PianoRollPage() {
  const isAudioLoaded = useMusicStore(s => s.isAudioLoaded)
  const initAudio = useMusicStore(s => s.initAudio)

  useEffect(() => {
    initAudio()
  }, [initAudio])

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <LoadingOverlay isLoading={!isAudioLoaded} />
      
      <header className="flex items-center justify-between px-4 h-14 border-b bg-background shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-md">
            <Music4 className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            BeatFlow
          </h1>
        </div>
      </header>

      <Toolbar />

      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="border-r border-border bg-card">
            <div className="flex flex-col h-full">
              <Tabs defaultValue="tracks" className="flex-1 flex flex-col">
                <div className="px-3 py-2 border-b border-border">
                  <TabsList className="w-full">
                    <TabsTrigger value="tracks" className="flex-1">Tracks</TabsTrigger>
                    <TabsTrigger value="generate" className="flex-1">AI</TabsTrigger>
                    <TabsTrigger value="json" className="flex-1">RAW DATA</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="tracks" className="flex-1 p-0 m-0 data-[state=active]:flex flex-col min-h-0">
                  <ScrollArea className="flex-1">
                    <TrackList />
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="generate" className="flex-1 p-0 m-0 data-[state=active]:flex flex-col min-h-0">
                  <PromptPanelWrapper />
                </TabsContent>

                <TabsContent value="json" className="flex-1 p-0 m-0 data-[state=active]:flex flex-col min-h-0">
                  <JsonEditorWrapper />
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          <ResizablePanel defaultSize={80}>
            <PianoRollWrapper />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}

function PromptPanelWrapper() {
  const generate = useMusicStore(s => s.generate)
  const isGenerating = useMusicStore(s => s.isGenerating)
  return <PromptPanel onGenerate={generate} isGenerating={isGenerating} />
}

function JsonEditorWrapper() {
  const applyJson = useMusicStore(s => s.applyJson)
  const notes = useMusicStore(s => s.notes)
  const bpm = useMusicStore(s => s.bpm)
  const tracks = useMusicStore(s => s.tracks)
  const musicData = useMemo(() => notesToMusicData(notes, bpm, tracks), [notes, bpm, tracks])
  return <JsonEditor musicData={musicData} onApply={applyJson} />
}

function PianoRollWrapper() {
  const notes = useMusicStore(s => s.notes)
  const selectedNoteIds = useMusicStore(s => s.selectedNoteIds)
  const snapValue = useMusicStore(s => s.snapValue)
  const tool = useMusicStore(s => s.tool)
  const activeTrackId = useMusicStore(s => s.activeTrackId)
  const hiddenTracks = useMusicStore(s => s.hiddenTracks)
  const setNotes = useMusicStore(s => s.setNotes)
  const setSelectedNoteIds = useMusicStore(s => s.setSelectedNoteIds)
  const seek = useMusicStore(s => s.seek)

  const visibleNotes = useMemo(() => notes.filter(n => !hiddenTracks.has(n.track_id)), [notes, hiddenTracks])
  
  const noteRange: [number, number] = useMemo(() => [21, 108], [])

  return (
    <PianoRoll
      notes={visibleNotes}
      selectedNoteIds={selectedNoteIds}
      beatWidth={40}
      totalBeats={64}
      snapValue={snapValue}
      tool={tool}
      activeTrackId={activeTrackId}
      onNotesChange={setNotes}
      onSelectionChange={setSelectedNoteIds}
      onSeek={seek}
      noteRange={noteRange}
      playheadBeat={-1} 
    />
  )
}