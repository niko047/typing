import { useState, useCallback, useRef } from "react";

interface UseSimpleMarkdownEditorProps {
  editorRef: React.RefObject<HTMLDivElement>;
  onContentChange?: (content: string) => void;
}

export function useSimpleMarkdownEditor({
  editorRef,
  onContentChange,
}: UseSimpleMarkdownEditorProps) {
  const [content, setContent] = useState("");
  const lastContentRef = useRef("");

  // Simple content sync without DOM manipulation
  const syncContent = useCallback(() => {
    if (!editorRef.current) return;

    const textContent = editorRef.current.textContent || "";
    if (textContent !== lastContentRef.current) {
      lastContentRef.current = textContent;
      setContent(textContent);
      onContentChange?.(textContent);
    }
  }, [editorRef, onContentChange]);

  // Apply markdown transformation to current line
  const applyMarkdownTransform = useCallback(
    (command: string) => {
      if (!editorRef.current) return;

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      // Get current line
      const range = selection.getRangeAt(0);
      const currentLine = getCurrentLine(range);
      if (!currentLine) return;

      // Transform the line based on command
      let newContent = "";
      const cleanText = removeSlashCommand(currentLine.textContent || "");

      switch (command) {
        case "h1":
          newContent = `# ${cleanText || "Heading 1"}`;
          break;
        case "h2":
          newContent = `## ${cleanText || "Heading 2"}`;
          break;
        case "h3":
          newContent = `### ${cleanText || "Heading 3"}`;
          break;
        case "quote":
          newContent = `> ${cleanText || "Quote"}`;
          break;
        case "divider":
          newContent = cleanText ? `${cleanText}\n\n---` : "---";
          break;
        default:
          newContent = cleanText;
      }

      // Replace the current line with transformed content
      replaceCurrentLine(currentLine, newContent);
      syncContent();
    },
    [editorRef, syncContent]
  );

  // Handle Enter key for special markdown behavior
  const handleEnterKey = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!editorRef.current) return;

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const currentLine = getCurrentLine(range);
      if (!currentLine) return;

      const lineText = currentLine.textContent || "";

      // If we're in a quote line, create a normal paragraph on Enter
      if (lineText.startsWith("> ")) {
        e.preventDefault();

        // Insert a new line without the quote prefix
        const newLine = document.createElement("div");
        newLine.innerHTML = "<br>";

        // Insert after current line
        currentLine.parentNode?.insertBefore(newLine, currentLine.nextSibling);

        // Move cursor to new line
        const newRange = document.createRange();
        newRange.setStart(newLine, 0);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);

        syncContent();
      }
    },
    [editorRef, syncContent]
  );

  return {
    content,
    syncContent,
    applyMarkdownTransform,
    handleEnterKey,
  };
}

// Helper functions
function getCurrentLine(range: Range): Element | null {
  let container = range.startContainer;

  // Walk up to find the line container (div, p, etc.)
  while (container && container.nodeType !== Node.ELEMENT_NODE) {
    container = container.parentNode!;
  }

  // Look for block-level elements
  while (
    container &&
    !["DIV", "P", "H1", "H2", "H3", "H4", "H5", "H6", "BLOCKQUOTE"].includes(
      (container as Element).tagName
    )
  ) {
    container = container.parentNode!;
  }

  return container as Element;
}

function removeSlashCommand(text: string): string {
  const slashIndex = text.lastIndexOf("/");
  if (slashIndex === -1) return text;

  const beforeSlash = text.substring(0, slashIndex);
  const afterSlash = text.substring(slashIndex + 1);
  const spaceIndex = afterSlash.indexOf(" ");
  const remainingText =
    spaceIndex !== -1 ? afterSlash.substring(spaceIndex + 1) : "";

  return (beforeSlash + remainingText).trim();
}

function replaceCurrentLine(lineElement: Element, newContent: string) {
  // Simple replacement - just update the text content for now
  // This avoids complex DOM manipulation that breaks cursor position
  lineElement.textContent = newContent;
}
