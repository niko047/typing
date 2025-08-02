import { ReactNode } from 'react';

export interface BlockType {
  id: string;
  label: string;
  description: string;
  icon: ReactNode;
  keywords: string[];
  command: string;
  category: 'basic' | 'heading' | 'media' | 'advanced';
}

export interface SlashCommandState {
  isOpen: boolean;
  query: string;
  position: { x: number; y: number };
  selectedIndex: number;
  filteredCommands: BlockType[];
}

export interface EditorSelection {
  range: Range | null;
  slashPosition: number;
  currentLine: string;
}