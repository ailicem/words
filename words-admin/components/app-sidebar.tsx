"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, LogOut, Users } from "lucide-react";
import type { SafeUser } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  superOnly?: boolean;
};

const navItems: NavItem[] = [
  { href: "/books", label: "单词书管理", icon: BookOpen },
  { href: "/admin-users", label: "管理员管理", icon: Users, superOnly: true },
];

function initials(name: string, email: string) {
  const source = name?.trim() || email?.trim() || "?";
  return source.slice(0, 1).toUpperCase();
}

export function AppSidebar({ user }: { user: SafeUser }) {
  const pathname = usePathname();
  const router = useRouter();

  const items = navItems.filter((item) => !item.superOnly || user.role === "super_admin");

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/signin");
  };

  return (
    <aside className="bg-sidebar text-sidebar-foreground flex h-screen w-64 shrink-0 flex-col border-r">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="bg-sidebar-primary flex size-8 items-center justify-center rounded-lg">
          <BookOpen className="text-sidebar-primary-foreground size-4" />
        </div>
        <span className="text-sm font-semibold">单词管理后台</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active && "bg-sidebar-accent text-sidebar-accent-foreground"
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <div className="flex items-center gap-3 rounded-md px-3 py-2">
          <Avatar className="size-8">
            <AvatarFallback className="bg-sidebar-accent">
              {initials(user.name, user.email)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sidebar-foreground truncate text-sm font-medium">
              {user.name || "系统管理员"}
            </p>
            <p className="text-muted-foreground truncate text-xs">{user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            title="退出登录"
            className="text-muted-foreground hover:bg-sidebar-accent hover:text-destructive flex size-8 shrink-0 items-center justify-center rounded-md transition-colors"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}