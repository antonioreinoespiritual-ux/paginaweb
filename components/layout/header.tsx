"use client";

import { signOut } from "next-auth/react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function Header() {
  const { theme, setTheme } = useTheme();
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-end gap-2 border-b bg-background/95 px-6 backdrop-blur">
      <Button variant="ghost" size="sm" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
      <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/signin" })}>
        Sign out
      </Button>
    </header>
  );
}
