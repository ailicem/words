"use client";

import type { SafeUser } from "@/lib/types";
import { AppSidebar } from "@/components/app-sidebar";

export function AdminLayout({
  user,
  children,
}: {
  user: SafeUser;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar user={user} />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}