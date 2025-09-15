"use client";

import React from "react";

type Toast = { id: number; message: string };

const Ctx = React.createContext<{
  push: (message: string) => void;
} | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const push = React.useCallback((message: string) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message }]);
    setTimeout(
      () => setToasts((t) => t.filter((x) => x.id !== id)),
      3000
    );
  }, []);

  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="bg-slate-800 text-slate-100 px-4 py-2 rounded-md shadow-lg animate-in slide-in-from-bottom fade-in"
          >
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
