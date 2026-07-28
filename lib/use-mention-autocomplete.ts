"use client";

import { type ChangeEvent, useRef, useState } from "react";

export function useMentionAutocomplete(knownHandles: string[]) {
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionAnchor, setMentionAnchor] = useState(0);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const suggestions =
    mentionQuery !== null
      ? knownHandles.filter((h) =>
          h.slice(1).toLowerCase().startsWith(mentionQuery.toLowerCase()),
        )
      : [];

  function onInputChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    setValue: (v: string) => void,
    max?: number,
  ): void {
    const val = max ? e.target.value.slice(0, max) : e.target.value;
    setValue(val);
    const cursor = e.target.selectionStart ?? val.length;
    const before = val.slice(0, cursor);
    const match = before.match(/@([\p{L}\d_]*)$/u);
    if (match && match.index !== undefined) {
      setMentionQuery(match[1]);
      setMentionAnchor(match.index);
    } else {
      setMentionQuery(null);
    }
  }

  function insertMention(
    handle: string,
    value: string,
    setValue: (v: string) => void,
    max?: number,
  ): void {
    const after = value.slice(mentionAnchor + 1 + (mentionQuery?.length ?? 0));
    const next = (value.slice(0, mentionAnchor) + handle + " " + after).slice(
      0,
      max ?? Infinity,
    );
    setValue(next);
    setMentionQuery(null);
    setTimeout(() => (inputRef.current as HTMLElement | null)?.focus(), 0);
  }

  function onKeyDown(
    e: React.KeyboardEvent,
    value: string,
    setValue: (v: string) => void,
    max?: number,
  ): boolean {
    if (suggestions.length === 0) return false;
    if (e.key === "Tab") {
      e.preventDefault();
      insertMention(suggestions[0]!, value, setValue, max);
      return true;
    }
    if (e.key === "Escape" || e.key === " ") {
      setMentionQuery(null);
      return false;
    }
    return false;
  }

  function dismiss() {
    setMentionQuery(null);
  }

  return { suggestions, mentionQuery, inputRef, onInputChange, insertMention, onKeyDown, dismiss };
}
