"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { getUser, type User } from "@/lib/auth";
import { AppSidebar } from "@/components/app-sidebar";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const fired = useRef(false);

  useEffect(() => {
    const u = getUser();
    setUser(u);
    setReady(true);
    if (!u && !fired.current) {
      fired.current = true;
      window.location.replace("/signin");
    }
  }, []);

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar user={user} />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}