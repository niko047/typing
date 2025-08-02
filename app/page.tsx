"use client";

import { useState, useRef, useEffect } from "react";
import { EditorToolbar } from "@/components/editor-toolbar";

export default function Home() {
  const [content, setContent] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

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
    const text = e.currentTarget.innerText || "";
    setContent(text);
  };

  return (
    <div
      className={`flex flex-col h-screen bg-background pt-20 ${
        isFullscreen ? "fixed inset-0 z-50" : ""
      }`}
    >
      <EditorToolbar
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        isFullscreen={isFullscreen}
        editorRef={editorRef}
      />

      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-8 md:p-12 pt-24">
          <div
            ref={editorRef}
            contentEditable
            className="min-h-[calc(100vh-200px)] outline-none text-foreground leading-relaxed focus:outline-none empty:before:content-['Start_writing...'] empty:before:text-muted-foreground"
            onInput={handleTextChange}
            suppressContentEditableWarning
            style={{
              fontSize: "16px",
              lineHeight: "1.8",
              fontFamily: "var(--font-sans)",
            }}
          ></div>
        </div>
      </div>
    </div>
  );
}
