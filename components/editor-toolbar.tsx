"use client";

import { RefObject, useState, useEffect } from "react";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Heading,
  Code,
  Maximize2,
  Minimize2,
  MoreVertical,
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface EditorToolbarProps {
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  editorRef: RefObject<HTMLDivElement | null>;
}

export function EditorToolbar({
  onToggleFullscreen,
  isFullscreen,
  editorRef,
}: EditorToolbarProps) {
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateFormatStates();
  };

  const formatText = (tag: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();

    if (selectedText || tag === "p") {
      document.execCommand("formatBlock", false, tag);
    }

    editorRef.current?.focus();
  };

  const updateFormatStates = () => {
    setIsBold(document.queryCommandState("bold"));
    setIsItalic(document.queryCommandState("italic"));
    setIsUnderline(document.queryCommandState("underline"));
  };

  useEffect(() => {
    const handleSelectionChange = () => {
      updateFormatStates();
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, []);

  return (
    <div className="fixed top-8 left-1/2 -translate-x-1/2 z-10 max-w-4xl w-full px-8 md:px-12">
      <div className="mx-auto w-fit bg-background/80 backdrop-blur-md  rounded-lg shadow-lg">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isBold ? "secondary" : "ghost"}
                      size="icon"
                      onClick={() => executeCommand("bold")}
                      className={cn(
                        "h-8 w-8",
                        isBold && "bg-secondary text-secondary-foreground"
                      )}
                    >
                      <Bold className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Bold (Cmd+B)</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isItalic ? "secondary" : "ghost"}
                      size="icon"
                      onClick={() => executeCommand("italic")}
                      className={cn(
                        "h-8 w-8",
                        isItalic && "bg-secondary text-secondary-foreground"
                      )}
                    >
                      <Italic className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Italic (Cmd+I)</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isUnderline ? "secondary" : "ghost"}
                      size="icon"
                      onClick={() => executeCommand("underline")}
                      className={cn(
                        "h-8 w-8",
                        isUnderline && "bg-secondary text-secondary-foreground"
                      )}
                    >
                      <Underline className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Underline (Cmd+U)</TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>

            <Separator orientation="vertical" className="mx-1 h-6" />

            <div className="flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Heading className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="bottom" align="start">
                  <DropdownMenuItem
                    onClick={() => formatText("p")}
                    className="flex items-center gap-2"
                  >
                    <Pilcrow className="h-4 w-4" />
                    <span>Paragraph</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => formatText("h1")}
                    className="flex items-center gap-2"
                  >
                    <Heading1 className="h-4 w-4" />
                    <span>Heading 1</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => formatText("h2")}
                    className="flex items-center gap-2"
                  >
                    <Heading2 className="h-4 w-4" />
                    <span>Heading 2</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => formatText("h3")}
                    className="flex items-center gap-2"
                  >
                    <Heading3 className="h-4 w-4" />
                    <span>Heading 3</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <List className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="bottom" align="start">
                  <DropdownMenuItem
                    onClick={() => executeCommand("insertUnorderedList")}
                    className="flex items-center gap-2"
                  >
                    <List className="h-4 w-4" />
                    <span>Bullet List</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => executeCommand("insertOrderedList")}
                    className="flex items-center gap-2"
                  >
                    <ListOrdered className="h-4 w-4" />
                    <span>Numbered List</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => formatText("blockquote")}
                      className="h-8 w-8"
                    >
                      <Quote className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Quote</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
