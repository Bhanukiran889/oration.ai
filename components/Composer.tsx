import { useState } from "react";
import { Button } from "./ui/button";

interface ComposerProps {
  sessionId?: number;
  onSend: (text: string) => void;
  placeholder?: string;
  position?: "bottom" | "center"; 
}

export function Composer({
  onSend,
  placeholder = "Message...",
  position = "bottom",
}: ComposerProps) {
  const [text, setText] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return;
        onSend(text);
        setText("");
      }}
      className={`mx-auto w-full max-w-4xl p-0 ${
        position === "bottom" ? "sticky bottom-3 z-10" : ""
      }`}
    >
      <div
        className={`relative mx-auto flex max-w-5xl items-center justify-center px-4 ${
          position === "center" ? "h-full" : ""
        }`}
      >
        <div className="flex w-full items-center gap-2 rounded-full border bg-background/80 px-3 py-2 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-full bg-transparent px-2 py-2 text-sm outline-none"
          />
          <Button
            type="submit"
            className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            Send
          </Button>
        </div>
      </div>
    </form>
  );
}
