// Simple line-based markdown system - each line is independent

export interface LineInfo {
  element: Element;
  text: string;
  isMarkdown: boolean;
  type: 'heading1' | 'heading2' | 'heading3' | 'quote' | 'divider' | 'paragraph';
}

// Convert a single line of text to HTML
export function renderLineToHTML(text: string): { html: string; type: LineInfo['type'] } {
  const trimmed = text.trim();
  
  // Heading 1
  if (trimmed.startsWith('# ')) {
    const content = trimmed.substring(2).trim();
    return {
      html: content,
      type: 'heading1'
    };
  }
  
  // Heading 2  
  if (trimmed.startsWith('## ')) {
    const content = trimmed.substring(3).trim();
    return {
      html: content,
      type: 'heading2'
    };
  }
  
  // Heading 3
  if (trimmed.startsWith('### ')) {
    const content = trimmed.substring(4).trim();
    return {
      html: content,
      type: 'heading3'
    };
  }
  
  // Quote
  if (trimmed.startsWith('> ')) {
    const content = trimmed.substring(2).trim();
    return {
      html: content,
      type: 'quote'
    };
  }
  
  // Divider
  if (trimmed === '---' || trimmed === '***') {
    return {
      html: '',
      type: 'divider'
    };
  }
  
  // Regular paragraph
  return {
    html: trimmed,
    type: 'paragraph'
  };
}

// Create HTML element for a line type
export function createLineElement(content: string, type: LineInfo['type']): HTMLElement {
  let element: HTMLElement;
  
  switch (type) {
    case 'heading1':
      element = document.createElement('h1');
      element.className = 'text-3xl font-bold mb-4';
      element.style.fontFamily = 'var(--font-jost), sans-serif';
      element.textContent = content || 'Heading 1';
      break;
      
    case 'heading2':
      element = document.createElement('h2');
      element.className = 'text-2xl font-bold mb-4';
      element.style.fontFamily = 'var(--font-jost), sans-serif';
      element.textContent = content || 'Heading 2';
      break;
      
    case 'heading3':
      element = document.createElement('h3');
      element.className = 'text-xl font-bold mb-4';
      element.style.fontFamily = 'var(--font-jost), sans-serif';
      element.textContent = content || 'Heading 3';
      break;
      
    case 'quote':
      element = document.createElement('blockquote');
      element.className = 'border-l-4 border-muted-foreground/20 pl-4 italic my-4';
      element.textContent = content || 'Quote';
      break;
      
    case 'divider':
      element = document.createElement('hr');
      element.className = 'my-8 border-muted-foreground/20';
      break;
      
    case 'paragraph':
    default:
      element = document.createElement('p');
      element.className = 'mb-4';
      element.textContent = content;
      break;
  }
  
  // Make all elements editable
  if (type !== 'divider') {
    element.contentEditable = 'true';
    element.style.outline = 'none';
  }
  
  return element;
}

// Check if text is markdown
export function isMarkdownSyntax(text: string): boolean {
  const trimmed = text.trim();
  return /^(#{1,3}\s|>\s|---$|\*\*\*$)/.test(trimmed);
}

// Apply slash command to text
export function applySlashCommand(text: string, command: string): string {
  // Remove slash command from text
  const slashIndex = text.lastIndexOf('/');
  if (slashIndex === -1) return text;
  
  const beforeSlash = text.substring(0, slashIndex);
  const afterSlash = text.substring(slashIndex + 1);
  const spaceIndex = afterSlash.indexOf(' ');
  const remainingText = spaceIndex !== -1 ? afterSlash.substring(spaceIndex + 1) : '';
  const cleanText = (beforeSlash + remainingText).trim();
  
  switch (command) {
    case 'h1':
      return `# ${cleanText || 'Heading 1'}`;
    case 'h2':
      return `## ${cleanText || 'Heading 2'}`;
    case 'h3':
      return `### ${cleanText || 'Heading 3'}`;
    case 'quote':
      return `> ${cleanText || 'Quote'}`;
    case 'divider':
      return '---';
    case 'text':
    case 'paragraph':
    default:
      return cleanText;
  }
}

// Get current line element from cursor position
export function getCurrentLineElement(editorElement: HTMLDivElement): Element | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  
  let element = selection.getRangeAt(0).startContainer;
  
  // Walk up to find the line element
  while (element && element !== editorElement) {
    if (element.nodeType === Node.ELEMENT_NODE) {
      const tagName = (element as Element).tagName;
      if (['P', 'H1', 'H2', 'H3', 'BLOCKQUOTE', 'HR', 'DIV'].includes(tagName)) {
        return element as Element;
      }
    }
    element = element.parentNode;
  }
  
  return null;
}

// Transform current line to new type
export function transformCurrentLine(editorElement: HTMLDivElement, command: string): boolean {
  const currentLine = getCurrentLineElement(editorElement);
  if (!currentLine) return false;
  
  const currentText = currentLine.textContent || '';
  const newText = applySlashCommand(currentText, command);
  const { html: content, type } = renderLineToHTML(newText);
  
  // Create new element
  const newElement = createLineElement(content, type);
  
  // Replace current line
  currentLine.replaceWith(newElement);
  
  // Set cursor in new element
  if (type !== 'divider') {
    const range = document.createRange();
    const selection = window.getSelection();
    range.selectNodeContents(newElement);
    range.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(range);
  }
  
  return true;
}

// Convert special block to paragraph when empty
export function convertToParagraphIfEmpty(element: Element): boolean {
  const text = element.textContent || '';
  const trimmedText = text.trim();
  
  // Only convert if completely empty
  if (trimmedText.length > 0) return false;
  
  const tagName = element.tagName.toLowerCase();
  
  // Only convert special blocks, not regular paragraphs
  if (!['h1', 'h2', 'h3', 'blockquote'].includes(tagName)) return false;
  
  
  // Create new paragraph
  const p = document.createElement('p');
  p.className = 'mb-4';
  p.contentEditable = 'true';
  p.style.outline = 'none';
  p.innerHTML = '<br>'; // Make it focusable
  
  // Replace the element
  element.replaceWith(p);
  
  // Set cursor in the new paragraph
  const range = document.createRange();
  const selection = window.getSelection();
  range.selectNodeContents(p);
  range.collapse(true);
  selection?.removeAllRanges();
  selection?.addRange(range);
  
  return true;
}

// Debug helper - get line info
export function getLineInfo(element: Element): LineInfo {
  const text = element.textContent || '';
  const tagName = element.tagName.toLowerCase();
  
  let type: LineInfo['type'] = 'paragraph';
  let isMarkdown = false;
  
  if (tagName === 'h1') {
    type = 'heading1';
    isMarkdown = true;
  } else if (tagName === 'h2') {
    type = 'heading2';
    isMarkdown = true;
  } else if (tagName === 'h3') {
    type = 'heading3';
    isMarkdown = true;
  } else if (tagName === 'blockquote') {
    type = 'quote';
    isMarkdown = true;
  } else if (tagName === 'hr') {
    type = 'divider';
    isMarkdown = true;
  }
  
  return {
    element,
    text,
    isMarkdown,
    type
  };
}