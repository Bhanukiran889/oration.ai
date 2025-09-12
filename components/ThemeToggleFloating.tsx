"use client";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { Sun, Moon } from "lucide-react";

export function ThemeToggleFloating() {
  const { theme, toggle } = useTheme();

  return (
    <div className="absolute top-4 right-4 z-50">
      <Button
        variant="outline"
        size="icon"
        onClick={toggle}
        className="rounded-full shadow-md"
      >
        {theme === "light" ? (
          <Moon className="h-5 w-5" />
        ) : (
          <Sun className="h-5 w-5" />
        )}
      </Button>
    </div>
  );
}
