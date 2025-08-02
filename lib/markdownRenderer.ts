// Simple markdown renderer that converts text to HTML for display
export function renderMarkdownToHTML(text: string): string {
  let html = text;
  
  // Split by lines to process each line
  const lines = html.split('\n');
  const processedLines = lines.map(line => {
    const trimmedLine = line.trim();
    
    // Headings
    if (trimmedLine.startsWith('### ')) {
      const content = trimmedLine.substring(4);
      return `<h3 class="text-xl font-bold mb-4" style="font-family: var(--font-jost), sans-serif;">${escapeHtml(content)}</h3>`;
    }
    if (trimmedLine.startsWith('## ')) {
      const content = trimmedLine.substring(3);
      return `<h2 class="text-2xl font-bold mb-4" style="font-family: var(--font-jost), sans-serif;">${escapeHtml(content)}</h2>`;
    }
    if (trimmedLine.startsWith('# ')) {
      const content = trimmedLine.substring(2);
      return `<h1 class="text-3xl font-bold mb-4" style="font-family: var(--font-jost), sans-serif;">${escapeHtml(content)}</h1>`;
    }
    
    // Quotes
    if (trimmedLine.startsWith('> ')) {
      const content = trimmedLine.substring(2);
      return `<blockquote class="border-l-4 border-muted-foreground/20 pl-4 italic my-4">${escapeHtml(content)}</blockquote>`;
    }
    
    // Dividers
    if (trimmedLine === '---' || trimmedLine === '***') {
      return `<hr class="my-8 border-muted-foreground/20">`;
    }
    
    // Regular paragraphs (non-empty lines)
    if (trimmedLine.length > 0) {
      return `<p class="mb-4">${escapeHtml(trimmedLine)}</p>`;
    }
    
    // Empty lines - preserve them for proper spacing
    return '<div><br></div>';
  });
  
  return processedLines.join('');
}

// Check if text contains markdown syntax that needs rendering
export function needsMarkdownRendering(text: string): boolean {
  return /^(#{1,3}\s|>\s|---$|^\*\*\*$)/m.test(text);
}

// Get cursor position as text offset
export function getCursorPosition(editorElement: HTMLDivElement): number {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return 0;
  
  const range = selection.getRangeAt(0);
  const preCaretRange = range.cloneRange();
  preCaretRange.selectNodeContents(editorElement);
  preCaretRange.setEnd(range.startContainer, range.startOffset);
  
  return preCaretRange.toString().length;
}

// Set cursor position from text offset
export function setCursorPosition(editorElement: HTMLDivElement, offset: number) {
  const selection = window.getSelection();
  if (!selection) return;
  
  let currentOffset = 0;
  const walker = document.createTreeWalker(
    editorElement,
    NodeFilter.SHOW_TEXT,
    null
  );
  
  let textNode = walker.nextNode();
  while (textNode) {
    const nodeLength = textNode.textContent?.length || 0;
    if (currentOffset + nodeLength >= offset) {
      const range = document.createRange();
      range.setStart(textNode, offset - currentOffset);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      return;
    }
    currentOffset += nodeLength;
    textNode = walker.nextNode();
  }
  
  // If we couldn't find the exact position, set cursor at the end
  const range = document.createRange();
  range.selectNodeContents(editorElement);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}