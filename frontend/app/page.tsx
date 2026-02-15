"use client"

import { PianoRoll } from "@/components/piano-roll/piano-roll"
import { Toolbar } from "@/components/toolbar"
import { TrackList } from "@/components/track-list"
import { PromptPanel } from "@/components/prompt-panel"
import { JsonEditor } from "@/components/json-editor"
import { LoadingOverlay } from "@/components/loading-overlay"
import { useMusicState } from "@/hooks/use-music-state"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Music4 } from "lucide-react"

export default function PianoRollPage() {
  const {
    notes,
    selectedNoteIds,
    tracks,
    activeTrackId,
    bpm,
    snapValue,
    tool,
    isPlaying,
    playheadBeat,
    isGenerating,
    musicData,
    hiddenTracks,
    canUndo,
    canRedo,
    isAudioLoaded,
    setNotes,
    setSelectedNoteIds,
    setActiveTrackId,
    setBpm,
    setSnapValue,
    setTool,
    play,
    stop,
    seek,
    rewind,
    generate,
    applyJson,
    toggleHidden,
    toggleMute,
    exportMidi
  } = useMusicState()

  const activeTrack = tracks.find(t => t.id === activeTrackId)
  const trackNotes = notes.filter(n => n.track_id === activeTrackId)

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <LoadingOverlay isLoading={!isAudioLoaded} />
      
      <header className="flex items-center justify-between px-4 h-14 border-b bg-background shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-md">
            <Music4 className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Music Editor
          </h1>
        </div>
      </header>

      <Toolbar
        tool={tool}
        onToolChange={setTool}
        snapValue={snapValue}
        onSnapChange={setSnapValue}
        isPlaying={isPlaying}
        onPlay={() => play()}
        onStop={stop}
        onRewind={rewind}
        bpm={bpm}
        onBpmChange={setBpm}
        currentBeat={Math.max(0, playheadBeat)}
        tracks={tracks}
        activeTrackId={activeTrackId}
        onActiveTrackChange={setActiveTrackId}
        onExport={exportMidi}
        onDelete={() => {
          if (selectedNoteIds.size > 0) {
            setNotes(notes.filter(n => !selectedNoteIds.has(n.id)))
            setSelectedNoteIds(new Set())
          }
        }}
        onCopy={() => {}}
        onPaste={() => {}}
        onUndo={canUndo ? () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true })) : () => {}}
        onRedo={canRedo ? () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'y', ctrlKey: true })) : () => {}}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="border-r border-border bg-card">
            <div className="flex flex-col h-full">
              <Tabs defaultValue="tracks" className="flex-1 flex flex-col">
                <div className="px-3 py-2 border-b border-border">
                  <TabsList className="w-full">
                    <TabsTrigger value="tracks" className="flex-1">Tracks</TabsTrigger>
                    <TabsTrigger value="generate" className="flex-1">AI</TabsTrigger>
                    <TabsTrigger value="json" className="flex-1">JSON</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="tracks" className="flex-1 p-0 m-0 data-[state=active]:flex flex-col min-h-0">
                  <ScrollArea className="flex-1">
                    <TrackList
                      tracks={tracks}
                      activeTrackId={activeTrackId}
                      notes={notes}
                      hiddenTracks={hiddenTracks}
                      onActiveTrackChange={setActiveTrackId}
                      onToggleHidden={toggleHidden}
                      onToggleMute={toggleMute}
                    />
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="generate" className="flex-1 p-0 m-0 data-[state=active]:flex flex-col min-h-0">
                  <PromptPanel onGenerate={generate} isGenerating={isGenerating} />
                </TabsContent>

                <TabsContent value="json" className="flex-1 p-0 m-0 data-[state=active]:flex flex-col min-h-0">
                  <JsonEditor musicData={musicData} onApply={applyJson} />
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          <ResizablePanel defaultSize={80}>
            <PianoRoll
              notes={notes.filter(n => !hiddenTracks.has(n.track_id))}
              selectedNoteIds={selectedNoteIds}
              beatWidth={40}
              totalBeats={64}
              snapValue={snapValue}
              tool={tool}
              playheadBeat={playheadBeat}
              activeTrackId={activeTrackId}
              onNotesChange={setNotes}
              onSelectionChange={setSelectedNoteIds}
              onSeek={seek}
              noteRange={[trackNotes.length ? Math.min(...trackNotes.map(n => n.note)) - 12 : 36, trackNotes.length ? Math.max(...trackNotes.map(n => n.note)) + 12 : 84]}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}