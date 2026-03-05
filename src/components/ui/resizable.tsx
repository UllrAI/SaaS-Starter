"use client";

import * as React from "react";
import { GripVerticalIcon } from "lucide-react";
import {
  Group as ResizableGroupPrimitive,
  Panel as ResizablePanelPrimitive,
  Separator as ResizableSeparatorPrimitive,
} from "react-resizable-panels";

import { cn } from "@/lib/utils";

function ResizablePanelGroup({
  className,
  ...props
}: React.ComponentProps<typeof ResizableGroupPrimitive>) {
  return (
    <ResizableGroupPrimitive
      data-slot="resizable-panel-group"
      className={cn(
        "flex h-full w-full data-[group-orientation=vertical]:flex-col",
        className,
      )}
      {...props}
    />
  );
}

function ResizablePanel({
  ...props
}: React.ComponentProps<typeof ResizablePanelPrimitive>) {
  return <ResizablePanelPrimitive data-slot="resizable-panel" {...props} />;
}

function ResizableHandle({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizableSeparatorPrimitive> & {
  withHandle?: boolean;
}) {
  return (
    <ResizableSeparatorPrimitive
      data-slot="resizable-handle"
      className={cn(
        "bg-border focus-visible:ring-ring relative flex w-px items-center justify-center after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-hidden data-[group-orientation=vertical]:h-px data-[group-orientation=vertical]:w-full data-[group-orientation=vertical]:after:left-0 data-[group-orientation=vertical]:after:h-1 data-[group-orientation=vertical]:after:w-full data-[group-orientation=vertical]:after:translate-x-0 data-[group-orientation=vertical]:after:-translate-y-1/2 [&[data-group-orientation=vertical]>div]:rotate-90",
        className,
      )}
      {...props}
    >
      {withHandle && (
        <div className="bg-border z-10 flex h-4 w-3 items-center justify-center rounded-xs border">
          <GripVerticalIcon className="size-2.5" />
        </div>
      )}
    </ResizableSeparatorPrimitive>
  );
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
