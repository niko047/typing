"use client";

import { useState, useRef, useEffect } from "react";
import { EditorToolbar } from "@/components/editor-toolbar";
import { useAutoCompletion } from "@/hooks/useAutoCompletion";
import { useLineMarkdown } from "@/hooks/useLineMarkdown";
import { useSlashCommands } from "@/hooks/useSlashCommands";
import { SlashCommandPopover } from "@/components/slash-command-popover";

export default function Home() {
  const [content, setContent] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const {
    applySlashCommand,
    handleKeyDown: handleLineMarkdownKeyDown,
    handleInput: handleLineMarkdownInput,
  } = useLineMarkdown({
    editorRef,
  });

  const {
    isLoading,
    error,
    handleKeyDown: handleAutoCompletionKeyDown,
    handleInput: handleAutoCompletionInput,
  } = useAutoCompletion({
    minTextLength: 10,
    contextLength: 500,
    editorRef,
  });

  const {
    slashState,
    handleInput: handleSlashInput,
    handleKeyDown: handleSlashKeyDown,
    executeCommand: executeSlashCommand,
    closeSlashMenu,
  } = useSlashCommands({
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

  // Initialize editor with a paragraph
  useEffect(() => {
    if (editorRef.current && editorRef.current.children.length === 0) {
      const p = document.createElement("p");
      p.className = "mb-4";
      p.contentEditable = "true";
      p.style.outline = "none";
      p.innerHTML = "<br>"; // Make it focusable
      editorRef.current.appendChild(p);

      // Focus the paragraph
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(p);
      range.collapse(true);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, []);

  // Line-based slash command execution
  const executeCommand = (command: any) => {
    const success = applySlashCommand(command.command);

    if (success) {
      // Update content for word count
      const newContent = editorRef.current?.textContent || "";
      setContent(newContent);
    }

    closeSlashMenu();
  };

  const handleTextChange = (e: React.FormEvent<HTMLDivElement>) => {
    const text = e.currentTarget.textContent || "";
    setContent(text);
    handleAutoCompletionInput(e);
    handleSlashInput(e);
    handleLineMarkdownInput(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Handle line markdown behaviors first (like converting empty blocks)
    const lineMarkdownHandled = handleLineMarkdownKeyDown(e);
    if (lineMarkdownHandled) return;

    // Handle slash commands next (they take priority when menu is open)
    const slashHandled = handleSlashKeyDown(e);
    if (!slashHandled) {
      // If slash commands didn't handle it, pass to auto-completion
      handleAutoCompletionKeyDown(e);
    }
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
                fontSize: "inherit",
                lineHeight: "inherit",
                fontFamily: "inherit",
                fontWeight: "400",
                letterSpacing: "0.25px",
              }}
            ></div>

            {/* Error display - Find better way to display errors */}
            {error && (
              <div className="mt-2 text-red-500 text-sm">
                Error: {error.message}
              </div>
            )}

            {isLoading && (
              <div className="fixed bottom-4 right-4 flex items-center gap-2">
                <div className="animate-pulse text-muted-foreground text-sm">
                  AI is thinking...
                </div>
              </div>
            )}

            {/* Slash Command Popover */}
            <SlashCommandPopover
              isOpen={slashState.isOpen}
              position={slashState.position}
              filteredCommands={slashState.filteredCommands}
              selectedIndex={slashState.selectedIndex}
              onSelect={executeCommand}
              onClose={closeSlashMenu}
            />
          </div>

          <div className="mt-8 text-xs text-muted-foreground space-y-2">
            <div className="flex justify-between">
              <p>
                Press{" "}
                <kbd className="px-1 py-0.5 text-xs bg-muted rounded">Tab</kbd>{" "}
                to trigger AI completion
              </p>
              <p>
                Press{" "}
                <kbd className="px-1 py-0.5 text-xs bg-muted rounded">Tab</kbd>{" "}
                again to accept or{" "}
                <kbd className="px-1 py-0.5 text-xs bg-muted rounded">Esc</kbd>{" "}
                to reject
              </p>
              <p>
                Type{" "}
                <kbd className="px-1 py-0.5 text-xs bg-muted rounded">/</kbd>{" "}
                for markdown formatting options
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
