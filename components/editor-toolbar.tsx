"use client";

import { RefObject, useState, useEffect } from "react";
import {
  Bold,
  Italic,
  Underline,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface EditorToolbarProps {
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  editorRef: RefObject<HTMLDivElement | null>;
}

export function EditorToolbar({
  editorRef,
}: EditorToolbarProps) {
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  const executeCommand = (command: string, value?: string) => {
    // eslint-disable-next-line deprecation/deprecation
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateFormatStates();
  };

  const updateFormatStates = () => {
    // eslint-disable-next-line deprecation/deprecation
    setIsBold(document.queryCommandState("bold"));
    // eslint-disable-next-line deprecation/deprecation
    setIsItalic(document.queryCommandState("italic"));
    // eslint-disable-next-line deprecation/deprecation
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
      <div className="mx-auto w-fit bg-background/80 backdrop-blur-md rounded-lg shadow-lg">
        <div className="flex items-center justify-center px-3 py-2">
          <div className="flex items-center gap-1">
            <TooltipProvider>
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
            </TooltipProvider>
          </div>
        </div>
      </div>
    </div>
  );
}