"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Loader2 } from "lucide-react";
import type { UserRole } from "@/lib/auth";
import { getUser, setSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const roleTabs: { value: UserRole; label: string }[] = [
  { value: "admin", label: "管理员" },
  { value: "user", label: "普通用户" },
];

export default function SignInPage() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>("admin");
  const [userMode, setUserMode] = useState<"signin" | "signup">("signin");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (getUser()) router.replace("/books");
  }, [router]);

  const isUserSignup = role === "user" && userMode === "signup";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isUserSignup) {
      if (!name.trim() || !email.trim() || !password.trim() || !confirm.trim()) {
        setError("请填写所有字段");
        return;
      }
      if (password !== confirm) {
        setError("两次输入的密码不一致");
        return;
      }
      if (password.length < 6) {
        setError("密码长度至少为 6 位");
        return;
      }
    } else {
      if (!email.trim() || !password.trim()) {
        setError("请输入邮箱和密码");
        return;
      }
    }

    setSubmitting(true);
    setError("");
    // demo：本地模拟登录/注册，成功后写入登录态并跳转
    setTimeout(() => {
      setSession({
        name: isUserSignup ? name.trim() : email.split("@")[0] || "用户",
        email: email.trim(),
        role,
      });
      router.replace("/books");
    }, 400);
  };

  const switchMode = (mode: "signin" | "signup") => {
    setUserMode(mode);
    setError("");
  };

  const switchRole = (next: UserRole) => {
    setRole(next);
    setError("");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="bg-primary flex size-12 items-center justify-center rounded-xl">
            <BookOpen className="text-primary-foreground size-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">单词管理后台</h1>
          <p className="text-muted-foreground text-sm">登录以进入系统</p>
        </div>

        {/* 角色切换 */}
        <div className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
          {roleTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => switchRole(tab.value)}
              className={cn(
                "rounded-md py-2 text-sm font-medium transition-colors",
                role === tab.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>{isUserSignup ? "注册" : "登录"}</CardTitle>
              <CardDescription>
                {role === "admin"
                  ? "管理员登录以进入管理后台"
                  : isUserSignup
                    ? "注册一个普通用户账号"
                    : "普通用户登录以开始使用"}
              </CardDescription>
            </CardHeader>

            {role === "user" && (
              <div className="px-6">
                <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
                  {(["signin", "signup"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => switchMode(mode)}
                      className={cn(
                        "rounded-md py-1.5 text-sm font-medium transition-colors",
                        userMode === mode
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {mode === "signin" ? "登录" : "注册"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <CardContent className="space-y-4 pb-0 pt-5">
              {isUserSignup && (
                <div className="space-y-2">
                  <Label htmlFor="name">姓名</Label>
                  <Input
                    id="name"
                    placeholder="请输入姓名"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={isUserSignup ? "至少 6 位" : "请输入密码"}
                  autoComplete={isUserSignup ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {isUserSignup && (
                <div className="space-y-2">
                  <Label htmlFor="confirm">确认密码</Label>
                  <Input
                    id="confirm"
                    type="password"
                    placeholder="再次输入密码"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </div>
              )}
              {error && <p className="text-destructive text-sm">{error}</p>}
            </CardContent>
            <CardFooter className="pt-5">
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="size-4 animate-spin" />}
                {isUserSignup ? "注册" : role === "admin" ? "登录" : "登录"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}