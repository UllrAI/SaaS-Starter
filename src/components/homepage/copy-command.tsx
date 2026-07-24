"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyCommand({
  command,
  copyLabel,
  copiedLabel,
}: {
  command: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-secondary/30 border-border mb-6 flex items-center justify-between gap-4 border border-dashed p-4">
      <div className="flex items-center gap-3 overflow-hidden">
        <span className="text-primary font-bold" translate="no">
          ➜
        </span>
        <span className="text-foreground truncate font-bold">{command}</span>
      </div>
      <button
        type="button"
        onClick={() => void handleCopy()}
        className="text-muted-foreground hover:text-primary flex-shrink-0 transition-colors"
        aria-label={copied ? copiedLabel : copyLabel}
      >
        {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
      </button>
    </div>
  );
}
