"use client";

import { useState, useSyncExternalStore } from "react";

const noop = () => () => {};

/** Shows an absolute invite URL with a copy button. */
export function CopyLink({ path, copyLabel, copiedLabel }: { path: string; copyLabel: string; copiedLabel: string }) {
  const origin = useSyncExternalStore(
    noop,
    () => window.location.origin,
    () => "",
  );
  const [copied, setCopied] = useState(false);
  const url = origin + path;
  return (
    <span className="flex min-w-0 items-center gap-2">
      <code className="min-w-0 flex-1 truncate font-mono text-xs">{url}</code>
      <button
        type="button"
        className="btn-ghost btn-sm shrink-0"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {}
        }}
      >
        {copied ? copiedLabel : copyLabel}
      </button>
    </span>
  );
}
