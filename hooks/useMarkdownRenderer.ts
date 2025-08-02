import { useCallback, useRef, useEffect } from 'react';
import { renderMarkdownToHTML, needsMarkdownRendering, getCursorPosition, setCursorPosition } from '@/lib/markdownRenderer';

interface UseMarkdownRendererProps {
  editorRef: React.RefObject<HTMLDivElement>;
}

export function useMarkdownRenderer({ editorRef }: UseMarkdownRendererProps) {
  const isRenderingRef = useRef(false);
  const lastRenderedContentRef = useRef('');
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Render markdown with cursor preservation
  const renderMarkdown = useCallback((force = false) => {
    if (!editorRef.current || isRenderingRef.current) return;
    
    const textContent = editorRef.current.textContent || '';
    
    // Skip if content hasn't changed and not forced
    if (textContent === lastRenderedContentRef.current && !force) return;
    
    // Only render if content contains markdown syntax
    if (!needsMarkdownRendering(textContent) && !force) {
      lastRenderedContentRef.current = textContent;
      return;
    }
    
    isRenderingRef.current = true;
    
    // Save cursor position
    const cursorPosition = getCursorPosition(editorRef.current);
    
    // Render markdown to HTML
    const html = renderMarkdownToHTML(textContent);
    
    // Update DOM
    editorRef.current.innerHTML = html;
    
    // Restore cursor position
    setCursorPosition(editorRef.current, cursorPosition);
    
    lastRenderedContentRef.current = textContent;
    isRenderingRef.current = false;
  }, [editorRef]);

  // Debounced render - only render after user stops typing
  const debouncedRender = useCallback(() => {
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }
    
    renderTimeoutRef.current = setTimeout(() => {
      renderMarkdown();
    }, 500); // Wait 500ms after last keystroke
  }, [renderMarkdown]);

  // Force immediate render (for slash commands)
  const forceRender = useCallback(() => {
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }
    renderMarkdown(true);
  }, [renderMarkdown]);

  // Check if currently rendering
  const isRendering = useCallback(() => {
    return isRenderingRef.current;
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, []);

  return {
    renderMarkdown: debouncedRender,
    forceRender,
    isRendering,
  };
}