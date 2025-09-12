"use client";

import { Button } from "@/components/ui/button";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { TextPlugin } from "gsap/TextPlugin";

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(TextPlugin);

    const tl = gsap.timeline({ repeat: -1, defaults: { ease: "power2.out" } });

    // User and AI messages
    const messages = [
      { type: "ai", text: "Hello! How can I help you with your career goals today?" },
      { type: "user", text: "I want advice on software engineering roles." },
      { type: "ai", text: "Great! Let’s explore your options and find the best fit." },
    ];

    messages.forEach((msg) => {
      if (msg.type === "user") {
        tl.fromTo(
          `.user-msg`,
          { opacity: 0, x: 50 },
          { opacity: 1, x: 0, duration: 0.8, text: msg.text }
        )
          .to(".user-msg", { duration: 1.5 }) // hold
          .to(".user-msg", { opacity: 0, x: 50, duration: 0.8 });
      } else {
        tl.fromTo(
          `.ai-msg`,
          { opacity: 0, x: -50, text: "" },
          { opacity: 1, x: 0, duration: 0.8, text: msg.text, delay: 0.5 }
        )
          .to(".ai-msg", { duration: 2 })
          .to(".ai-msg", { opacity: 0, x: -50, duration: 0.8 });
      }
    });
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6 bg-gradient-to-b from-background to-muted overflow-hidden">
      {/* Hero content */}
      <div className="z-10 max-w-3xl text-center space-y-6">
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-red-500">
          Chat Smarter with AI
        </h1>
        <p className="text-muted-foreground text-lg sm:text-xl">
          Start conversations, save your chats, and continue seamlessly anytime.
        </p>
        <div className="flex justify-center gap-4">
          <SignInButton mode="modal">
            <Button size="lg" className="px-6">
              Sign in
            </Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button size="lg" variant="outline" className="px-6">
              Sign up
            </Button>
          </SignUpButton>
        </div>
      </div>

      {/* Chat preview animation */}
      <div
        ref={containerRef}
        className="z-10 mt-12 w-full max-w-4xl rounded-xl border border-border bg-background p-6 shadow-lg sm:mt-20 flex flex-col gap-3 relative min-h-[200px]"
      >
        <div className="ai-msg self-start rounded-lg bg-gray-100 dark:bg-gray-800 p-3 text-left text-sm max-w-[65%]"></div>
        <div className="user-msg self-end rounded-lg bg-primary/10 dark:bg-primary/20 p-3 text-right text-sm max-w-[60%]"></div>
      </div>

      {/* Background glow */}
      <div className="absolute inset-0 -z-10 flex items-center justify-center opacity-10">
        <div className="h-[40rem] w-[40rem] rounded-full bg-primary blur-3xl" />
      </div>
    </div>
  );
}
