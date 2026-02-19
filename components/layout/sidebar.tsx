"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, LayoutDashboard, Target } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard", label: "Strategy Boards", icon: Target },
  { href: "/dashboard", label: "KPIs", icon: BarChart3 }
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-64 border-r bg-card/50 p-4 md:block">
      <h1 className="mb-6 text-xl font-semibold">Product Strategy Studio</h1>
      <nav className="space-y-2">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent",
              pathname === item.href && "bg-accent text-foreground"
            )}
          >
            <item.icon className="h-4 w-4" /> {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
