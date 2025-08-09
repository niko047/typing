"use client";

import { useState, useRef, useEffect } from "react";
import { EditorToolbar } from "@/components/editor-toolbar";
import { useAutoCompletion } from "@/hooks/useAutoCompletion";
import { useLineMarkdown } from "@/hooks/useLineMarkdown";
import { useSlashCommands } from "@/hooks/useSlashCommands";
import { createLineElement } from "@/lib/lineMarkdown";
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

  // Initialize editor with initial content
  useEffect(() => {
    if (editorRef.current && editorRef.current.children.length === 0) {
      // Create the initial structure
      const initialContent = [
        { text: "Hey there, I'm Niccolò", type: "heading1" as const },
        {
          text: "I'm currently working on Reweb, an AI-first design tool. I like building things and I'm particularly fascinated in AI implementations to solve problems.",
          type: "paragraph" as const,
        },
        { text: "", type: "paragraph" as const },
        {
          text: "I'm really not based anywhere, I'm a nomad and I love traveling the world while I build stuff and live crazy adventures.",
          type: "paragraph" as const,
        },
        { text: "", type: "paragraph" as const },
        { text: "Why is this website so weird?", type: "heading3" as const },
        {
          text: "Well it's a bit weird, it's a writing tool I built for myself. I also like writing sometimes, so this helps me. If you want to try it, go to the end of this file and continue writing the story, then click Tab, it will generate some text given the context. Then if you want to accept it, Tab again, otherwise don't.",
          type: "paragraph" as const,
        },
        {
          text: "If you want to reach out, @niccolodiana on X, or similar on other socials.",
          type: "quote" as const,
        },
        { text: "", type: "paragraph" as const },
        { text: "A short story about time", type: "heading3" as const },
        {
          text: "Traveling through the twists and turns of history seemed like the perfect adventure. I found myself leaping from ancient civilisations to futuristic worlds, each setting bursting with characters and tales waiting to be told. As I navigated through the vibrant tapestry of time, I encountered warriors, inventors, and dreamers, each with their own aspirations and challenges. With every leap, my understanding of humanity deepened, knitting together the threads of stories that linked us all across eras.",
          type: "paragraph" as const,
        },
        { text: "", type: "paragraph" as const },
        {
          text: "Amidst the chaos and beauty, I discovered that every moment held a lesson, a fleeting glimpse into the souls that shaped our world. It was as if the echoes of their voices guided me, urging me to not only witness but also share their legacies with others.",
          type: "paragraph" as const,
        },
        { text: "", type: "paragraph" as const },
      ];

      // Create and append each element
      initialContent.forEach((item) => {
        const element = createLineElement(item.text, item.type);
        editorRef.current!.appendChild(element);
      });

      // Set initial content for word count
      const initialText = initialContent
        .map((item) => item.text)
        .filter((text) => text)
        .join(" ");
      setContent(initialText);

      // Focus the last paragraph
      const lastParagraph = editorRef.current.lastElementChild;
      if (lastParagraph && lastParagraph.tagName === "P") {
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(lastParagraph);
        range.collapse(true);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
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
