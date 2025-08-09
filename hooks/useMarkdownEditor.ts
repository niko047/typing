import { useState, useCallback, useRef, useEffect } from "react";
import {
  parseMarkdownToBlocks,
  blocksToMarkdown,
  renderBlocksToHTML,
  getCurrentBlockFromCursor,
  applySlashCommand,
  MarkdownBlock,
} from "@/lib/markdown";

interface UseMarkdownEditorProps {
  editorRef: React.RefObject<HTMLDivElement>;
  onContentChange?: (content: string) => void;
}

export function useMarkdownEditor({
  editorRef,
  onContentChange,
}: UseMarkdownEditorProps) {
  const [blocks, setBlocks] = useState<MarkdownBlock[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const lastCaretPosition = useRef<{ blockId: string; offset: number } | null>(
    null
  );

  // Convert blocks to markdown text for external use
  const getMarkdownContent = useCallback(() => {
    return blocksToMarkdown(blocks);
  }, [blocks]);

  // Save caret position before DOM updates
  const saveCaretPosition = useCallback(() => {
    if (!editorRef.current) return;

    const currentBlock = getCurrentBlockFromCursor(editorRef.current);
    if (currentBlock) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        let offset = 0;

        // Calculate text offset within the block
        const blockElement = editorRef.current.querySelector(
          `[data-block-id="${currentBlock.blockId}"]`
        );
        if (blockElement) {
          const walker = document.createTreeWalker(
            blockElement,
            NodeFilter.SHOW_TEXT,
            null
          );

          let textNode;
          while ((textNode = walker.nextNode())) {
            if (textNode === range.startContainer) {
              offset += range.startOffset;
              break;
            }
            offset += textNode.textContent?.length || 0;
          }
        }

        lastCaretPosition.current = {
          blockId: currentBlock.blockId,
          offset,
        };
      }
    }
  }, [editorRef]);

  // Restore caret position after DOM updates
  const restoreCaretPosition = useCallback(() => {
    if (!editorRef.current || !lastCaretPosition.current) return;

    const { blockId, offset } = lastCaretPosition.current;
    const blockElement = editorRef.current.querySelector(
      `[data-block-id="${blockId}"]`
    );

    if (blockElement) {
      const walker = document.createTreeWalker(
        blockElement,
        NodeFilter.SHOW_TEXT,
        null
      );

      let currentOffset = 0;
      let textNode;

      while ((textNode = walker.nextNode())) {
        const nodeLength = textNode.textContent?.length || 0;
        if (currentOffset + nodeLength >= offset) {
          const range = document.createRange();
          const selection = window.getSelection();
          range.setStart(
            textNode,
            Math.min(offset - currentOffset, nodeLength)
          );
          range.collapse(true);
          selection?.removeAllRanges();
          selection?.addRange(range);
          break;
        }
        currentOffset += nodeLength;
      }
    }

    lastCaretPosition.current = null;
  }, [editorRef]);

  // Update the editor HTML when blocks change
  const updateEditor = useCallback(() => {
    if (!editorRef.current || isUpdating) return;

    setIsUpdating(true);
    saveCaretPosition();

    const html = renderBlocksToHTML(blocks);
    editorRef.current.innerHTML = html;

    // Restore focus and caret position after a brief delay
    setTimeout(() => {
      restoreCaretPosition();
      setIsUpdating(false);
    }, 0);
  }, [blocks, editorRef, isUpdating, saveCaretPosition, restoreCaretPosition]);

  // Parse editor content and update blocks (only when needed)
  const syncFromEditor = useCallback(() => {
    if (!editorRef.current || isUpdating) return;

    const textContent = editorRef.current.textContent || "";
    const markdownContent = textContent; // For now, just use raw text content

    // Only update if content actually changed
    const currentMarkdown = blocksToMarkdown(blocks);
    if (markdownContent !== currentMarkdown) {
      onContentChange?.(markdownContent);
    }
  }, [editorRef, isUpdating, onContentChange, blocks]);

  // Handle Enter key behavior
  const handleEnterKey = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const currentBlock = getCurrentBlockFromCursor(editorRef.current!);
      if (!currentBlock) return;

      const block = blocks[currentBlock.blockIndex];
      if (!block) return;

      // For quotes, pressing Enter should exit the quote and create a new paragraph
      if (block.type === "quote") {
        e.preventDefault();

        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const blockElement = editorRef.current!.querySelector(
            `[data-block-id="${block.id}"]`
          );

          if (blockElement) {
            // Get text before and after cursor
            const textContent = blockElement.textContent || "";
            let cursorOffset = 0;

            // Calculate cursor position within the block
            const walker = document.createTreeWalker(
              blockElement,
              NodeFilter.SHOW_TEXT,
              null
            );

            let textNode;
            while ((textNode = walker.nextNode())) {
              if (textNode === range.startContainer) {
                cursorOffset += range.startOffset;
                break;
              }
              cursorOffset += textNode.textContent?.length || 0;
            }

            const beforeCursor = textContent.substring(0, cursorOffset);
            const afterCursor = textContent.substring(cursorOffset);

            // Update blocks
            const newBlocks = [...blocks];

            if (beforeCursor.trim()) {
              // Update current quote block with text before cursor
              newBlocks[currentBlock.blockIndex] = {
                ...block,
                content: beforeCursor.trim(),
              };
            } else {
              // Remove empty quote block
              newBlocks.splice(currentBlock.blockIndex, 1);
            }

            // Insert new paragraph block
            const newParagraphBlock: MarkdownBlock = {
              type: "paragraph",
              content: afterCursor.trim(),
              id: `block-${Date.now()}-${Math.random()
                .toString(36)
                .substr(2, 9)}`,
            };

            newBlocks.splice(
              currentBlock.blockIndex + (beforeCursor.trim() ? 1 : 0),
              0,
              newParagraphBlock
            );

            setBlocks(newBlocks);

            // Set focus to the new paragraph after update
            setTimeout(() => {
              const newBlockElement = editorRef.current!.querySelector(
                `[data-block-id="${newParagraphBlock.id}"]`
              );
              if (newBlockElement) {
                const range = document.createRange();
                const selection = window.getSelection();
                range.setStart(newBlockElement, 0);
                range.collapse(true);
                selection?.removeAllRanges();
                selection?.addRange(range);
              }
            }, 0);
          }
        }
        return;
      }

      // For other block types, use default behavior but sync content
      setTimeout(() => syncFromEditor(), 0);
    },
    [blocks, editorRef, syncFromEditor]
  );

  // Apply slash command
  const applySlashCommandToCurrentBlock = useCallback(
    (command: string) => {
      const currentBlock = getCurrentBlockFromCursor(editorRef.current!);
      if (!currentBlock) return;

      const block = blocks[currentBlock.blockIndex];
      if (!block) return;

      const currentText = editorRef.current!.textContent || "";
      const newMarkdown = applySlashCommand(currentText, command);
      const newBlocks = parseMarkdownToBlocks(newMarkdown);

      setBlocks(newBlocks);
    },
    [blocks, editorRef]
  );

  // Initialize with empty content
  useEffect(() => {
    if (blocks.length === 0) {
      setBlocks([
        {
          type: "paragraph",
          content: "",
          id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        },
      ]);
    }
  }, [blocks.length]);

  // Update editor when blocks change
  useEffect(() => {
    updateEditor();
  }, [updateEditor]);

  return {
    blocks,
    getMarkdownContent,
    syncFromEditor,
    handleEnterKey,
    applySlashCommandToCurrentBlock,
    isUpdating,
  };
}
