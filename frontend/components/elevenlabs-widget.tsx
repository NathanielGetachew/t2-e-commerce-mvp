"use client"

import { useEffect, useState } from "react"
import { MessageCircle } from "lucide-react"
import Script from "next/script"

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'elevenlabs-convai': any
    }
  }
}


export function ElevenLabsWidget() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [showWidget, setShowWidget] = useState(false)

  // Placeholder agent ID - replace with actual ID when available
  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || "PLACEHOLDER_ID"

  const handleScriptLoad = () => {
    setIsLoaded(true)
  }

  const toggleWidget = () => {
    setShowWidget(!showWidget)
  }

  useEffect(() => {
    // Custom element declaration for TypeScript
    if (typeof window !== "undefined" && isLoaded && showWidget) {
      // The widget script will handle rendering the custom element
      console.log("[v0] ElevenLabs widget initialized with agent-id:", agentId)
    }
  }, [isLoaded, showWidget, agentId])

  return (
    <>
      <Script src="https://elevenlabs.io/convai-widget/index.js" strategy="lazyOnload" onLoad={handleScriptLoad} />

      {/* Floating Chat Button */}
      <button
        onClick={toggleWidget}
        className="fixed bottom-6 right-6 z-50 bg-primary text-primary-foreground rounded-full p-4 shadow-lg hover:scale-110 transition-transform hover:shadow-xl"
        aria-label="Open chat assistant"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {/* Widget Container */}
      {showWidget && (
        <div className="fixed bottom-24 right-6 z-50 bg-card border rounded-lg shadow-2xl p-6 w-[350px] max-w-[90vw]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">{"T2 Assistant"}</h3>
            <button onClick={toggleWidget} className="text-muted-foreground hover:text-foreground transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {isLoaded && agentId !== "PLACEHOLDER_ID" ? (
            <div className="elevenlabs-widget-container">
              <elevenlabs-convai agent-id={agentId} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <MessageCircle className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-2">{"Chat Agent Connecting..."}</p>
              <p className="text-xs text-muted-foreground">
                {agentId === "PLACEHOLDER_ID"
                  ? "Please configure NEXT_PUBLIC_ELEVENLABS_AGENT_ID"
                  : "Loading conversational AI..."}
              </p>
            </div>
          )}
        </div>
      )}
    </>
  )
}
