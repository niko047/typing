import { useEffect, useRef, useState, useCallback } from "react";
import { useCompletion } from "@ai-sdk/react";

interface UseAutoCompletionProps {
  minTextLength?: number;
  contextLength?: number;
  editorRef: React.RefObject<HTMLDivElement | null>;
}

export function useAutoCompletion({
  minTextLength = 10,
  contextLength = 500,
  editorRef,
}: UseAutoCompletionProps) {
  const [showGhostText, setShowGhostText] = useState(false);
  const [currentContent, setCurrentContent] = useState("");
  const ghostTextRef = useRef<HTMLSpanElement | null>(null);
  const isInsertingGhostTextRef = useRef(false);

  const { completion, complete, isLoading, stop, error } = useCompletion({
    api: "/api/completion",
    onFinish: (prompt, completion) => {
      if (completion) {
        setShowGhostText(true);
        insertGhostText(completion);
      }
    },
    onError: (error) => {
      console.error("AI completion error:", error);
    },
  });

  const insertGhostText = useCallback(
    (text: string) => {
      if (!editorRef.current) return;

      // Set flag to ignore input events during insertion
      isInsertingGhostTextRef.current = true;

      // Create ghost text span
      const ghostSpan = document.createElement("span");
      ghostSpan.className = "ghost-text";
      ghostSpan.style.opacity = "0.5";
      ghostSpan.style.color = "var(--muted-foreground)";
      ghostSpan.style.backgroundColor = "transparent";
      ghostSpan.style.fontFamily = "var(--font-eb-garamond), serif";
      ghostSpan.style.fontStyle = "italic";
      ghostSpan.textContent = text;
      ghostSpan.contentEditable = "false";
      ghostSpan.setAttribute("data-ghost-text", "true");
      ghostTextRef.current = ghostSpan;

      // Get current selection and ensure we have a proper text insertion point
      const selection = window.getSelection();

      try {
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);

          // If we're at the editor div level, we need to find or create a text node
          if (range.startContainer === editorRef.current) {
            // If editor has text content, append to the end
            if (
              editorRef.current.textContent &&
              editorRef.current.textContent.length > 0
            ) {
              // Find the last text node
              const walker = document.createTreeWalker(
                editorRef.current,
                NodeFilter.SHOW_TEXT,
                null
              );
              let lastTextNode = null;
              let node;
              while ((node = walker.nextNode())) {
                lastTextNode = node;
              }

              if (lastTextNode) {
                range.setStart(
                  lastTextNode,
                  lastTextNode.textContent?.length || 0
                );
                range.collapse(true);
              }
            }
          }

          // Insert the ghost text
          range.insertNode(ghostSpan);

          // Move cursor after ghost text
          const newRange = document.createRange();
          newRange.setStartAfter(ghostSpan);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
        } else {
          editorRef.current.appendChild(ghostSpan);

          // Set cursor after the ghost text
          const range = document.createRange();
          const selection = window.getSelection();
          range.setStartAfter(ghostSpan);
          range.collapse(true);
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      } catch (error) {
        console.error("Failed to insert ghost text:", error);
      }

      // Reset flag after a brief delay to allow DOM to settle
      setTimeout(() => {
        isInsertingGhostTextRef.current = false;
      }, 100);
    },
    [editorRef]
  );

  const removeGhostText = useCallback(() => {
    // Don't remove if we're currently inserting
    if (isInsertingGhostTextRef.current) {
      return;
    }

    // Remove by ref
    if (ghostTextRef.current) {
      ghostTextRef.current.remove();
      ghostTextRef.current = null;
    }

    // Also remove any ghost text elements that might be in the editor
    if (editorRef.current) {
      const ghostElements = editorRef.current.querySelectorAll(
        '[data-ghost-text="true"]'
      );
      ghostElements.forEach((el) => {
        el.remove();
      });
    }

    setShowGhostText(false);
  }, [editorRef]);

  const acceptCompletion = useCallback(() => {
    if (!ghostTextRef.current || !editorRef.current) return;

    const ghostText = ghostTextRef.current.textContent || "";

    // Replace ghost text with real text
    const textNode = document.createTextNode(ghostText);
    ghostTextRef.current.replaceWith(textNode);
    ghostTextRef.current = null;

    // Move cursor to end of inserted text
    const range = document.createRange();
    const selection = window.getSelection();
    range.setStartAfter(textNode);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);

    setShowGhostText(false);
    stop();

    // Update content
    const newContent = editorRef.current.textContent || "";
    setCurrentContent(newContent);

    return newContent;
  }, [editorRef, stop]);

  const triggerCompletion = useCallback(
    async (content: string) => {
      if (content.length < minTextLength) {
        return;
      }

      // Only clear existing completion if there is one
      if (showGhostText) {
        removeGhostText();
      }
      stop();

      const context = content.slice(-contextLength);

      try {
        await complete(context);
      } catch (err) {
        console.error("Failed to complete:", err);
      }
    },
    [
      complete,
      contextLength,
      minTextLength,
      removeGhostText,
      stop,
      showGhostText,
    ]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const content = e.currentTarget.textContent || "";

      // Tab key handling
      if (e.key === "Tab") {
        e.preventDefault();

        if (showGhostText && ghostTextRef.current) {
          // Accept completion
          acceptCompletion();
        } else if (!isLoading) {
          // Trigger new completion
          setCurrentContent(content);
          triggerCompletion(content);
        }
        return;
      }

      // ESC key kills the ghost text
      if (e.key === "Escape" && showGhostText) {
        e.preventDefault();
        removeGhostText();
        stop();
        return;
      }

      // Any other key removes ghost text (but not during insertion)
      if (
        showGhostText &&
        !e.metaKey &&
        !e.ctrlKey &&
        e.key !== "Shift" &&
        !isInsertingGhostTextRef.current
      ) {
        removeGhostText();
        stop();
      }
    },
    [
      showGhostText,
      isLoading,
      acceptCompletion,
      triggerCompletion,
      removeGhostText,
      stop,
    ]
  );

  const handleInput = useCallback(() => {
    // Don't remove ghost text if we're currently inserting it
    if (isInsertingGhostTextRef.current) {
      return;
    }

    // Remove ghost text on actual user input
    if (showGhostText) {
      removeGhostText();
      stop();
    }
  }, [showGhostText, removeGhostText, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      removeGhostText();
      stop();
    };
  }, [removeGhostText, stop]);

  return {
    isLoading,
    error,
    showGhostText,
    handleKeyDown,
    handleInput,
  };
}
