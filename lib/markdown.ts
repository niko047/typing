// Simple markdown system for the editor

export interface MarkdownBlock {
  type:
    | "paragraph"
    | "heading1"
    | "heading2"
    | "heading3"
    | "quote"
    | "divider";
  content: string;
  id: string;
}

export interface MarkdownDocument {
  blocks: MarkdownBlock[];
}

// Convert markdown text to structured blocks
export function parseMarkdownToBlocks(text: string): MarkdownBlock[] {
  const lines = text.split("\n");
  const blocks: MarkdownBlock[] = [];
  let currentBlockLines: string[] = [];
  let currentBlockType: MarkdownBlock["type"] = "paragraph";

  const flushCurrentBlock = () => {
    if (currentBlockLines.length > 0) {
      blocks.push({
        type: currentBlockType,
        content: currentBlockLines.join("\n").trim(),
        id: generateBlockId(),
      });
      currentBlockLines = [];
      currentBlockType = "paragraph";
    }
  };

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Divider
    if (trimmedLine === "---" || trimmedLine === "***") {
      flushCurrentBlock();
      blocks.push({
        type: "divider",
        content: "",
        id: generateBlockId(),
      });
      continue;
    }

    // Headings
    if (trimmedLine.startsWith("# ")) {
      flushCurrentBlock();
      currentBlockType = "heading1";
      currentBlockLines = [trimmedLine.substring(2)];
      flushCurrentBlock();
      continue;
    }

    if (trimmedLine.startsWith("## ")) {
      flushCurrentBlock();
      currentBlockType = "heading2";
      currentBlockLines = [trimmedLine.substring(3)];
      flushCurrentBlock();
      continue;
    }

    if (trimmedLine.startsWith("### ")) {
      flushCurrentBlock();
      currentBlockType = "heading3";
      currentBlockLines = [trimmedLine.substring(4)];
      flushCurrentBlock();
      continue;
    }

    // Quote
    if (trimmedLine.startsWith("> ")) {
      if (currentBlockType !== "quote") {
        flushCurrentBlock();
        currentBlockType = "quote";
      }
      currentBlockLines.push(trimmedLine.substring(2));
      continue;
    }

    // Empty line - flush current block
    if (trimmedLine === "") {
      flushCurrentBlock();
      continue;
    }

    // Regular text
    if (currentBlockType !== "paragraph") {
      flushCurrentBlock();
    }
    currentBlockLines.push(line);
  }

  // Flush remaining block
  flushCurrentBlock();

  // Ensure we always have at least one block
  if (blocks.length === 0) {
    blocks.push({
      type: "paragraph",
      content: "",
      id: generateBlockId(),
    });
  }

  return blocks;
}

// Convert blocks back to markdown text
export function blocksToMarkdown(blocks: MarkdownBlock[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case "heading1":
          return `# ${block.content}`;
        case "heading2":
          return `## ${block.content}`;
        case "heading3":
          return `### ${block.content}`;
        case "quote":
          return block.content
            .split("\n")
            .map((line) => `> ${line}`)
            .join("\n");
        case "divider":
          return "---";
        case "paragraph":
        default:
          return block.content;
      }
    })
    .join("\n\n");
}

// Render blocks to HTML for display
export function renderBlocksToHTML(blocks: MarkdownBlock[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case "heading1":
          return `<h1 class="text-3xl font-bold mb-4" style="font-family: var(--font-jost), sans-serif;" data-block-id="${
            block.id
          }">${escapeHtml(block.content)}</h1>`;
        case "heading2":
          return `<h2 class="text-2xl font-bold mb-4" style="font-family: var(--font-jost), sans-serif;" data-block-id="${
            block.id
          }">${escapeHtml(block.content)}</h2>`;
        case "heading3":
          return `<h3 class="text-xl font-bold mb-4" style="font-family: var(--font-jost), sans-serif;" data-block-id="${
            block.id
          }">${escapeHtml(block.content)}</h3>`;
        case "quote":
          return `<blockquote class="border-l-4 border-muted-foreground/20 pl-4 italic my-4" data-block-id="${
            block.id
          }">${escapeHtml(block.content).replace(/\n/g, "<br>")}</blockquote>`;
        case "divider":
          return `<hr class="my-8 border-muted-foreground/20" data-block-id="${block.id}">`;
        case "paragraph":
        default:
          return block.content.trim()
            ? `<p class="mb-4" data-block-id="${block.id}">${escapeHtml(
                block.content
              ).replace(/\n/g, "<br>")}</p>`
            : `<p class="mb-4" data-block-id="${block.id}"><br></p>`;
      }
    })
    .join("");
}

// Get the current block based on cursor position
export function getCurrentBlockFromCursor(
  editorElement: HTMLDivElement
): { blockId: string; blockIndex: number } | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  const range = selection.getRangeAt(0);
  let element = range.startContainer;

  // Walk up the DOM to find the block element
  while (element && element !== editorElement) {
    if (element.nodeType === Node.ELEMENT_NODE) {
      const blockId = (element as Element).getAttribute("data-block-id");
      if (blockId) {
        // Find the block index
        const allBlocks = editorElement.querySelectorAll("[data-block-id]");
        const blockIndex = Array.from(allBlocks).findIndex(
          (el) => el.getAttribute("data-block-id") === blockId
        );
        return { blockId, blockIndex };
      }
    }
    if (element.parentNode) {
      element = element.parentNode;
    } else {
      break;
    }
  }

  return null;
}

// Helper functions
function generateBlockId(): string {
  return `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Convert current line to markdown based on slash command
export function applySlashCommand(
  currentText: string,
  command: string
): string {
  // Remove the slash command from the text
  const slashIndex = currentText.lastIndexOf("/");
  const beforeSlash = currentText.substring(0, slashIndex);
  const afterSlash = currentText.substring(slashIndex + 1);
  const spaceIndex = afterSlash.indexOf(" ");
  const remainingText =
    spaceIndex !== -1 ? afterSlash.substring(spaceIndex + 1) : "";
  const cleanText = (beforeSlash + remainingText).trim();

  switch (command) {
    case "h1":
    case "heading1":
      return `# ${cleanText || "Heading 1"}`;
    case "h2":
    case "heading2":
      return `## ${cleanText || "Heading 2"}`;
    case "h3":
    case "heading3":
      return `### ${cleanText || "Heading 3"}`;
    case "quote":
      return `> ${cleanText || "Quote"}`;
    case "divider":
      return cleanText ? `${cleanText}\n\n---` : "---";
    case "text":
    case "paragraph":
    default:
      return cleanText;
  }
}
