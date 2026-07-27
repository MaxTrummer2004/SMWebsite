"use client";

import { PixelCharacter } from "@/components/pixel-character";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

type Message = { role: "user" | "assistant"; content: string };

export function MascotChat(): ReactNode {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "hey! i'm Brixel 👾 what's up?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next: Message[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/mascot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "chat", messages: next }),
      });
      const data = await res.json() as { reply?: string };
      if (data.reply) {
        setMessages((m) => [...m, { role: "assistant", content: data.reply! }]);
      }
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "oops, my pixels glitched 😵" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="focus-ring fixed bottom-6 right-6 z-50 flex items-center gap-2 border-2 border-foreground bg-background px-3 py-2 transition-colors hover:bg-accent/10"
        aria-label="Chat with Brixel"
      >
        <PixelCharacter scale={3} />
        <span className="font-pixel text-[9px]">Brixel</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="pixel-clip fixed bottom-20 right-6 z-50 flex w-80 flex-col border-2 border-foreground bg-background shadow-lg"
          >
            {/* Header */}
            <div className="flex items-center gap-2 border-b-2 border-foreground px-4 py-3">
              <PixelCharacter scale={3} />
              <span className="font-pixel text-[10px]">Brixel</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="focus-ring ml-auto font-mono text-xs text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            {/* Messages */}
            <div className="flex max-h-72 flex-col gap-3 overflow-y-auto p-4">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] border px-3 py-2 font-mono text-xs leading-relaxed ${
                      m.role === "user"
                        ? "border-accent bg-accent/10 text-foreground"
                        : "border-border bg-muted text-foreground"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="border border-border bg-muted px-3 py-2 font-pixel text-[9px] text-muted-foreground">
                    ...
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="flex gap-2 border-t-2 border-foreground p-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") send(); }}
                placeholder="say something..."
                className="flex-1 border border-border bg-background px-3 py-1.5 font-mono text-xs outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={send}
                disabled={loading || !input.trim()}
                className="border-2 border-foreground bg-foreground px-3 py-1.5 font-mono text-xs text-background transition-opacity disabled:opacity-40 hover:bg-foreground/90"
              >
                ↵
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
