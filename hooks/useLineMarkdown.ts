import { useCallback } from 'react';
import { transformCurrentLine, getCurrentLineElement, getLineInfo, convertToParagraphIfEmpty } from '@/lib/lineMarkdown';

interface UseLineMarkdownProps {
  editorRef: React.RefObject<HTMLDivElement | null>;
}

export function useLineMarkdown({ editorRef }: UseLineMarkdownProps) {
  
  // Apply slash command to current line only
  const applySlashCommand = useCallback((command: string) => {
    if (!editorRef.current) {
      return false;
    }
    
    const success = transformCurrentLine(editorRef.current, command);
    return success;
  }, [editorRef]);
  
  // Debug helper - get info about current line
  const getCurrentLineInfo = useCallback(() => {
    if (!editorRef.current) return null;
    
    const currentLine = getCurrentLineElement(editorRef.current);
    if (!currentLine) return null;
    
    return getLineInfo(currentLine);
  }, [editorRef]);
  
  // Debug helper - get info about all lines
  const getAllLinesInfo = useCallback(() => {
    if (!editorRef.current) return [];
    
    const lines = editorRef.current.children;
    return Array.from(lines).map(line => getLineInfo(line));
  }, [editorRef]);
  
  // Handle key events for special behavior
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!editorRef.current) return false;
    
    // Handle Backspace in empty special blocks
    if (e.key === 'Backspace') {
      const currentLine = getCurrentLineElement(editorRef.current);
      if (currentLine) {
        const lineInfo = getLineInfo(currentLine);
        
        // Only convert if it's a special block that's completely empty
        if (lineInfo.isMarkdown && lineInfo.text.trim() === '') {
          e.preventDefault();
          convertToParagraphIfEmpty(currentLine);
          return true; // Handled
        }
      }
    }
    
    return false; // Not handled
  }, [editorRef]);
  
  // Handle input events (no automatic conversion on input)
  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    // No automatic conversion - let the user explicitly backspace to convert
    return;
  }, []);

  return {
    applySlashCommand,
    getCurrentLineInfo,
    getAllLinesInfo,
    handleKeyDown,
    handleInput,
  };
}