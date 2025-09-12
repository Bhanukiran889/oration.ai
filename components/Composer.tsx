import { useState } from "react";
import { Button } from "./ui/button";

export function Composer({ onSend }: { sessionId: number; onSend: (text: string) => void }) {
    const [text, setText] = useState('');
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          onSend(text);
          setText('');
        }}
        className="sticky bottom-3 z-10 mx-auto w-full max-w-3xl p-0"
      >
        <div className="relative mx-auto flex max-w-3xl items-center justify-center px-4">
          <div className="flex w-full items-center gap-2 rounded-full border bg-background/80 px-3 py-2 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Message..."
              className="w-full rounded-full bg-transparent px-2 py-2 text-sm outline-none"
            />
            <Button type="submit" className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground">
              Send
            </Button>
          </div>
        </div>
      </form>
    );
  }