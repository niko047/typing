import { BlockType } from '@/types/editor';

export const blockTypes: BlockType[] = [
  // Basic blocks
  {
    id: 'paragraph',
    label: 'Text',
    description: 'Just start writing with plain text.',
    icon: <span className="text-sm">T</span>,
    keywords: ['text', 'paragraph', 'plain'],
    command: 'text',
    category: 'basic',
  },
  
  // Headings
  {
    id: 'heading1',
    label: 'Heading 1',
    description: 'Big section heading.',
    icon: <span className="text-sm font-bold">H1</span>,
    keywords: ['heading', 'h1', 'title', 'big'],
    command: 'h1',
    category: 'heading',
  },
  {
    id: 'heading2',
    label: 'Heading 2',
    description: 'Medium section heading.',
    icon: <span className="text-sm font-bold">H2</span>,
    keywords: ['heading', 'h2', 'subtitle'],
    command: 'h2',
    category: 'heading',
  },
  {
    id: 'heading3',
    label: 'Heading 3',
    description: 'Small section heading.',
    icon: <span className="text-sm font-bold">H3</span>,
    keywords: ['heading', 'h3', 'subheading'],
    command: 'h3',
    category: 'heading',
  },
  
  // Text formatting
  {
    id: 'quote',
    label: 'Quote',
    description: 'Capture a quote.',
    icon: <span className="text-sm">"</span>,
    keywords: ['quote', 'blockquote', 'citation'],
    command: 'quote',
    category: 'basic',
  },
  
  // Layout
  {
    id: 'divider',
    label: 'Divider',
    description: 'Visually divide blocks.',
    icon: <span className="text-sm">—</span>,
    keywords: ['divider', 'separator', 'line', 'hr'],
    command: 'divider',
    category: 'basic',
  },
];

export const getFilteredCommands = (query: string): BlockType[] => {
  if (!query) return blockTypes;
  
  const lowerQuery = query.toLowerCase();
  return blockTypes.filter(command => 
    command.label.toLowerCase().includes(lowerQuery) ||
    command.keywords.some(keyword => keyword.toLowerCase().includes(lowerQuery))
  );
};