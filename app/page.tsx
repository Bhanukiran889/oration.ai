"use client";

import { trpc } from "@/lib/trpc/client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/routers/_app";
import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import { useToast } from "@/lib/toast/ToastProvider";
import { Composer } from "@/components/Composer";
import { MessageBubble } from "@/components/MessageBubble";
import { ThemeToggleFloating } from "@/components/ThemeToggleFloating";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { HeroSection } from "@/components/layout/Hero";
import gsap from "gsap";
import { Button } from "@/components/ui/button";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type MessageItem = RouterOutputs["message"]["list"][number];

export default function ChatPage() {
  const { user } = useUser();
  const utils = trpc.useUtils();
  const { push } = useToast();
  const { data: sessions } = trpc.session.list.useQuery({});
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);

  const messageInput = useMemo(
    () =>
      activeSessionId === null ? { sessionId: 0 } : { sessionId: activeSessionId },
    [activeSessionId]
  );

  const {
    data: messages,
    isLoading: messagesLoading,
    error: messagesError,
  } = trpc.message.list.useQuery(messageInput, { enabled: activeSessionId !== null });

  const createSession = trpc.session.create.useMutation({
    onSuccess: async (s) => {
      await utils.session.list.invalidate();
      setActiveSessionId(s.id);
    },
    onError: (e) => push(e.message || "Failed to create session"),
  });

  const deleteSession = trpc.session.delete.useMutation({
    onSuccess: async () => {
      await utils.session.list.invalidate();
      setActiveSessionId(null);
    },
    onError: (e) => push(e.message || "Failed to delete session"),
  });

  const updateTitle = trpc.session.updateTitle.useMutation({
    onError: (e) => push(e.message || "Failed to rename session"),
  });

  // Local messages for optimistic UI
  const [localMessages, setLocalMessages] = useState<MessageItem[]>([]);
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);

  const sendMessage = trpc.message.sendMessage.useMutation({
    onMutate: async (vars) => {
      setTypingMessageId("pending"); // show placeholder
      const isFirst = !messages || messages.length === 0;
      return { isFirst, content: vars.content };
    },
    onSuccess: async (_data, _vars, ctx) => {
      await utils.message.list.invalidate(messageInput);
      if (ctx?.isFirst && activeSessionId) {
        const title = (ctx.content || "").slice(0, 60);
        updateTitle.mutate({ id: activeSessionId, title });
        await utils.session.list.invalidate();
      }
    },
    onError: (e) => push(e.message || "Failed to send message"),
    onSettled: () => {
      setTypingMessageId(null);
    },
  });

  // When new AI message arrives, replace placeholder
  useEffect(() => {
    if (!messages) return;
    setLocalMessages(messages);
  }, [messages]);

  // Auto scroll to bottom
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages, typingMessageId]);

  // Scroll button logic
  const [showScrollButton, setShowScrollButton] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const isAtBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < 50;
      setShowScrollButton(!isAtBottom);
    };

    container.addEventListener("scroll", handleScroll);
    // Initial check in case the content loads already scrolled down
    handleScroll();
    return () => container.removeEventListener("scroll", handleScroll);
  }, [localMessages]); // Re-run this effect if localMessages change to re-attach listener and check initial state

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    // Optimistic user bubble
    const tempUser: MessageItem = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: text,
    };
    setLocalMessages((prev) => [...prev, tempUser]);

    // Show placeholder while Gemini thinks
    setTypingMessageId("pending");

    if (!activeSessionId) {
      createSession.mutate(
        {},
        {
          onSuccess: (s) => {
            sendMessage.mutate({ sessionId: s.id, content: text });
          },
        }
      );
    } else {
      sendMessage.mutate({ sessionId: activeSessionId, content: text });
    }
  };

  return (
    <>
      <SignedOut>
        <HeroSection />
      </SignedOut>

      <SignedIn>
        <SidebarProvider>
          <div className="flex h-screen w-full">
            {/* Sidebar */}
            <div className="hidden md:flex md:w-72 lg:w-80">
              <AppSidebar
                sessions={sessions || []}
                activeSessionId={activeSessionId}
                onSelectSession={setActiveSessionId}
                onNewChat={() => createSession.mutate({})}
                onDeleteSession={(id) => deleteSession.mutate({ id })}
                isDeleting={deleteSession.isPending}
              />
            </div>

            {/* Main */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <header className="flex items-center justify-between border-b p-2 md:hidden">
                <SidebarTrigger />
                <ThemeToggleFloating />
              </header>

              <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative"> {/* Added relative for scroll button positioning */}
                <ThemeToggleFloating />
                <div
                  ref={scrollContainerRef} // Assign scrollContainerRef here
                  className="flex-1 chat-scroll overflow-y-auto px-4 py-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border hover:scrollbar-thumb-border/80"
                >
                  <div className="mx-auto w-full max-w-3xl flex flex-col gap-4">
                    {activeSessionId && messagesLoading && (
                      <p className="text-center text-sm text-muted-foreground">
                        Loading messages…
                      </p>
                    )}

                    {activeSessionId && messagesError && (
                      <p className="text-center text-sm text-destructive">
                        Failed to load messages: {messagesError.message}
                      </p>
                    )}

                    {activeSessionId &&
                      !messagesLoading &&
                      (!localMessages || localMessages.length === 0) && (
                        <p className="text-center text-sm text-muted-foreground">
                          No messages yet. Start by typing below
                        </p>
                      )}

                    {localMessages?.map((m: MessageItem) => (
                      <MessageBubble key={m.id} message={m} />
                    ))}

                    {typingMessageId === "pending" && (
                      <div
                        ref={(el) => {
                          if (el) {
                            gsap.fromTo(
                              el,
                              { opacity: 0.3, scale: 0.95 },
                              {
                                opacity: 1,
                                scale: 1.05,
                                duration: 1.2,
                                ease: "power1.inOut",
                                yoyo: true,
                                repeat: -1,
                              }
                            );
                          }
                        }}
                        className="mx-auto w-full max-w-3xl italic text-center font-medium text-gray-500"
                      >
                        thinking...
                      </div>
                    )}

                    <div ref={bottomRef} />
                  </div>
                </div>

                {showScrollButton && (
                  <Button
                    onClick={scrollToBottom}
                    className="absolute bottom-24 right-6 w-8 h-8 rounded-full bg-slate-900 text-white shadow-lg hover:bg-slate-700 transition z-10" // Added z-10 for visibility above content
                  >
                    ↓
                  </Button>
                )}

                {/* Composer */}
                {!activeSessionId ? (
                  <div className="flex-1 flex flex-col items-center justify-start p-4 text-center gap-2">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                      Hello, {user?.fullName || user?.username || "User"}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Navigate your career with clarity.
                    </p>
                    <Composer
                      onSend={handleSend}
                      position="center"
                      placeholder="Ask anything about your career..."
                    />
                  </div>
                ) : !messagesLoading && localMessages?.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center p-4">
                    <Composer
                      sessionId={activeSessionId}
                      onSend={handleSend}
                      position="center"
                      placeholder="Ask anything about your career..."
                    />
                  </div>
                ) : (
                  <Composer
                    sessionId={activeSessionId}
                    onSend={handleSend}
                    position="bottom"
                  />
                )}
              </main>
            </div>
          </div>
        </SidebarProvider>
      </SignedIn>
    </>
  );
}