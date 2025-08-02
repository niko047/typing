"use client";

import { useEffect, useRef } from 'react';
import { BlockType } from '@/types/editor';

interface SlashCommandPopoverProps {
  isOpen: boolean;
  position: { x: number; y: number };
  filteredCommands: BlockType[];
  selectedIndex: number;
  onSelect: (command: BlockType) => void;
  onClose: () => void;
}

export function SlashCommandPopover({
  isOpen,
  position,
  filteredCommands,
  selectedIndex,
  onSelect,
  onClose,
}: SlashCommandPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          // Parent component handles navigation
          break;
        case 'ArrowUp':
          e.preventDefault();
          // Parent component handles navigation
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            onSelect(filteredCommands[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, selectedIndex, filteredCommands, onSelect, onClose]);

  // Auto-scroll selected item into view
  useEffect(() => {
    if (isOpen && popoverRef.current) {
      const selectedElement = popoverRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      ) as HTMLElement;
      
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        });
      }
    }
  }, [selectedIndex, isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      className="fixed z-50 w-80 max-h-96 overflow-y-auto bg-popover border border-border rounded-lg shadow-lg"
      style={{
        left: position.x,
        top: position.y + 24, // Offset below the cursor
      }}
    >
      <div className="p-2">
        {filteredCommands.length === 0 ? (
          <div className="px-3 py-2 text-sm text-muted-foreground">
            No commands found
          </div>
        ) : (
          filteredCommands.map((command, index) => (
            <div
              key={command.id}
              data-index={index}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors
                ${
                  index === selectedIndex
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent/50'
                }
              `}
              onClick={() => onSelect(command)}
            >
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-muted rounded border">
                {command.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {command.label}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {command.description}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}