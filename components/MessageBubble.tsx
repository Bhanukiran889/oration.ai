"use client";

import { AppRouter } from "@/server/routers/_app";
import { inferRouterOutputs } from "@trpc/server";

import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import gsap from "gsap";
import { TextPlugin } from "gsap/TextPlugin";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type MessageItem = RouterOutputs["message"]["list"][number];

interface MessageBubbleProps {
  message: MessageItem;
  isTyping?: boolean;
}

export function MessageBubble({ message, isTyping = false }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const hiddenRef = useRef<HTMLDivElement>(null); // GSAP target (not visible)
  const [displayText, setDisplayText] = useState(isTyping ? "" : message.content);

  useEffect(() => {
    if (!isUser && isTyping && hiddenRef.current) {
      gsap.registerPlugin(TextPlugin);
      gsap.killTweensOf(hiddenRef.current);

      gsap.to(hiddenRef.current, {
        duration: message.content.length * 0.005 + 1,
        text: message.content,
        ease: "none",
        onUpdate: () => {
          setDisplayText(hiddenRef.current?.textContent || "");
        },
        onComplete: () => {
          setDisplayText(message.content);
        },
      });
    } else if (!isTyping) {
      setDisplayText(message.content);
    }
  }, [isUser, isTyping, message.content]);

  return (
    <div className={"flex " + (isUser ? "justify-end" : "justify-start")}>
      {isUser ? (
        <div className="my-2 max-w-[70%] rounded-2xl border bg-primary/10 px-3 py-2">
          <div className="mb-1 text-xs opacity-70">You</div>
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
        </div>
      ) : (
        <div className="my-3 w-full max-w-3xl">
          <div className="mb-1 text-xs opacity-70">Assistant</div>
          <div className="prose prose-invert max-w-none break-words">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeSanitize]}
            >
              {displayText}
            </ReactMarkdown>
          </div>
          {/* hidden div for GSAP to animate safely */}
          <div ref={hiddenRef} style={{ display: "none" }} />
        </div>
      )}
    </div>
  );
}
