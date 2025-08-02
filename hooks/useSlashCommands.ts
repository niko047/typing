import { useState, useCallback, useRef, useEffect } from 'react';
import { BlockType, SlashCommandState, EditorSelection } from '@/types/editor';
import { blockTypes, getFilteredCommands } from '@/config/blockTypes';

interface UseSlashCommandsProps {
  editorRef: React.RefObject<HTMLDivElement | null>;
}

export function useSlashCommands({ editorRef }: UseSlashCommandsProps) {
  const [slashState, setSlashState] = useState<SlashCommandState>({
    isOpen: false,
    query: '',
    position: { x: 0, y: 0 },
    selectedIndex: 0,
    filteredCommands: [],
  });

  const selectionRef = useRef<EditorSelection>({
    range: null,
    slashPosition: -1,
    currentLine: '',
  });

  // Calculate cursor position for popover placement
  const getCursorPosition = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return { x: 0, y: 0 };
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    // If rect is empty (cursor at beginning), use container position
    if (rect.width === 0 && rect.height === 0) {
      const container = range.startContainer;
      const element = container.nodeType === Node.TEXT_NODE 
        ? container.parentElement 
        : container as Element;
      
      if (element) {
        const elementRect = element.getBoundingClientRect();
        return {
          x: elementRect.left,
          y: elementRect.bottom,
        };
      }
    }

    return {
      x: rect.left,
      y: rect.bottom,
    };
  }, []);

  // Get current line text and slash position
  const getCurrentLineInfo = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !editorRef.current) {
      return { line: '', slashIndex: -1 };
    }

    const range = selection.getRangeAt(0);
    const container = range.startContainer;
    
    // Get the text content of the current line
    let textNode = container;
    if (container.nodeType !== Node.TEXT_NODE) {
      // Find the text node at the cursor
      const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        null
      );
      textNode = walker.nextNode() || container;
    }

    const text = textNode.textContent || '';
    const cursorOffset = range.startOffset;
    
    // Find line boundaries (from start to cursor)
    const beforeCursor = text.substring(0, cursorOffset);
    const lineStart = Math.max(
      beforeCursor.lastIndexOf('\n'),
      beforeCursor.lastIndexOf('\r')
    ) + 1;
    
    const currentLine = beforeCursor.substring(lineStart);
    const slashIndex = currentLine.lastIndexOf('/');
    
    return { line: currentLine, slashIndex };
  }, [editorRef]);

  // Open slash command menu
  const openSlashMenu = useCallback((query: string = '') => {
    const position = getCursorPosition();
    const filteredCommands = getFilteredCommands(query);
    
    setSlashState({
      isOpen: true,
      query,
      position,
      selectedIndex: 0,
      filteredCommands,
    });

    // Store current selection info
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const { line, slashIndex } = getCurrentLineInfo();
      selectionRef.current = {
        range: selection.getRangeAt(0).cloneRange(),
        slashPosition: slashIndex,
        currentLine: line,
      };
    }
  }, [getCursorPosition, getCurrentLineInfo]);

  // Close slash command menu
  const closeSlashMenu = useCallback(() => {
    setSlashState(prev => ({ ...prev, isOpen: false }));
    selectionRef.current = {
      range: null,
      slashPosition: -1,
      currentLine: '',
    };
  }, []);

  // Update slash command query
  const updateSlashQuery = useCallback((query: string) => {
    const filteredCommands = getFilteredCommands(query);
    setSlashState(prev => ({
      ...prev,
      query,
      filteredCommands,
      selectedIndex: Math.min(prev.selectedIndex, Math.max(0, filteredCommands.length - 1)),
    }));
  }, []);

  // Navigate through commands
  const navigateCommands = useCallback((direction: 'up' | 'down') => {
    setSlashState(prev => {
      const maxIndex = prev.filteredCommands.length - 1;
      let newIndex = prev.selectedIndex;
      
      if (direction === 'down') {
        newIndex = newIndex >= maxIndex ? 0 : newIndex + 1;
      } else {
        newIndex = newIndex <= 0 ? maxIndex : newIndex - 1;
      }
      
      return { ...prev, selectedIndex: newIndex };
    });
  }, []);

  // Execute selected command
  const executeCommand = useCallback((command: BlockType) => {
    if (!editorRef.current) {
      closeSlashMenu();
      return;
    }

    try {
      // Return the command for external handling
      return command;
    } catch (error) {
      console.error('Failed to execute slash command:', error);
      closeSlashMenu();
    }
  }, [editorRef, closeSlashMenu]);

  // Handle input events to detect slash commands
  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    if (!editorRef.current) return;

    const { line, slashIndex } = getCurrentLineInfo();
    
    if (slashIndex !== -1) {
      // Extract query after the slash
      const afterSlash = line.substring(slashIndex + 1);
      
      // If there's a space immediately after the slash, don't trigger slash commands
      if (afterSlash.startsWith(' ')) {
        if (slashState.isOpen) {
          closeSlashMenu();
        }
        return;
      }
      
      // Extract the command part (before any space)
      const spaceIndex = afterSlash.indexOf(' ');
      const query = spaceIndex !== -1 ? afterSlash.substring(0, spaceIndex) : afterSlash;
      
      if (!slashState.isOpen) {
        openSlashMenu(query);
      } else {
        updateSlashQuery(query);
      }
    } else if (slashState.isOpen) {
      closeSlashMenu();
    }
  }, [editorRef, getCurrentLineInfo, slashState.isOpen, openSlashMenu, updateSlashQuery, closeSlashMenu]);

  // Handle key down events
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!slashState.isOpen) return false;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        navigateCommands('down');
        return true;
        
      case 'ArrowUp':
        e.preventDefault();
        navigateCommands('up');
        return true;
        
      case 'Enter':
        e.preventDefault();
        const selectedCommand = slashState.filteredCommands[slashState.selectedIndex];
        if (selectedCommand) {
          executeCommand(selectedCommand);
        }
        return true;
        
      case 'Escape':
        e.preventDefault();
        closeSlashMenu();
        return true;
        
      default:
        return false;
    }
  }, [slashState, navigateCommands, executeCommand, closeSlashMenu]);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (slashState.isOpen && editorRef.current && !editorRef.current.contains(e.target as Node)) {
        closeSlashMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [slashState.isOpen, editorRef, closeSlashMenu]);

  return {
    slashState,
    handleInput,
    handleKeyDown,
    executeCommand,
    closeSlashMenu,
  };
}