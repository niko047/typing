"use client";

import { useState, useRef, useEffect } from "react";
import { EditorToolbar } from "@/components/editor-toolbar";
import { useAutoCompletion } from "@/hooks/useAutoCompletion";

export default function Home() {
  const [content, setContent] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const { isLoading, error, handleKeyDown, handleInput } = useAutoCompletion({
    minTextLength: 10,
    contextLength: 500,
    editorRef,
  });

  useEffect(() => {
    const words = content
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
    const chars = content.length;
    setWordCount(words);
    setCharCount(chars);
  }, [content]);

  const handleTextChange = (e: React.FormEvent<HTMLDivElement>) => {
    const text = e.currentTarget.textContent || "";
    setContent(text);
    handleInput();
  };

  return (
    <div
      className={`flex flex-col h-screen bg-background ${
        isFullscreen ? "fixed inset-0 z-50" : ""
      }`}
    >
      <EditorToolbar
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        isFullscreen={isFullscreen}
        editorRef={editorRef}
      />

      <div className="flex-1 overflow-auto pt-20">
        <div className="max-w-4xl mx-auto p-8 md:p-12 pt-24">
          <div className="relative">
            <div
              ref={editorRef}
              contentEditable
              className="min-h-[calc(100vh-200px)] outline-none text-foreground leading-relaxed focus:outline-none empty:before:content-['Start_writing...'] empty:before:text-muted-foreground"
              onInput={handleTextChange}
              onKeyDown={handleKeyDown}
              suppressContentEditableWarning
              style={{
                fontSize: "16px",
                lineHeight: "1.8",
                fontFamily: "var(--font-sans)",
              }}
            ></div>

            {/* Error display - Find better way to display errors */}
            {error && (
              <div className="mt-2 text-red-500 text-sm">
                Error: {error.message}
              </div>
            )}

            {/* Loading indicator - Find better way to display loading */}
            {isLoading && (
              <div className="fixed bottom-4 right-4 flex items-center gap-2">
                <div className="animate-pulse text-muted-foreground text-sm">
                  AI is thinking...
                </div>
              </div>
            )}
          </div>

          {/* Instructions - I don't like the UI, change? */}
          <div className="mt-8 text-xs text-muted-foreground">
            <p>
              Press{" "}
              <kbd className="px-1 py-0.5 text-xs bg-muted rounded">Tab</kbd> to
              trigger AI completion
            </p>
            <p>
              Press{" "}
              <kbd className="px-1 py-0.5 text-xs bg-muted rounded">Tab</kbd>{" "}
              again to accept or{" "}
              <kbd className="px-1 py-0.5 text-xs bg-muted rounded">Esc</kbd> to
              reject
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
