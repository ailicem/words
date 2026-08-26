import { useCallback, useEffect, useState } from "react";
import type { GetServerSideProps } from "next";
import { Loader2, Pencil, Plus, Search } from "lucide-react";
import type { SafeUser } from "@/lib/types";
import { sanitizeUser, getSessionUser } from "@/lib/server/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminLayout } from "@/components/admin-layout";

type AdminItem = SafeUser;
type Role = AdminItem["role"];
type Status = AdminItem["status"];

const roleLabels: Record<Role, string> = {
  super_admin: "系统管理员",
  admin: "管理员",
};
const statusLabels: Record<Status, string> = {
  active: "启用",
  disabled: "停用",
};

function initials(name: string) {
  return (name || "?").slice(0, 1).toUpperCase();
}

function formatDate(value: string) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("zh-CN");
}

type FormState = {
  id?: number;
  name: string;
  email: string;
  password: string;
  role: Role;
  status: Status;
};

const emptyForm: FormState = {
  name: "",
  email: "",
  password: "",
  role: "admin",
  status: "active",
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const sessionUser = await getSessionUser(ctx.req);
  if (!sessionUser) {
    return { redirect: { destination: "/signin", permanent: false } };
  }
  // 普通管理员无权访问
  if (sessionUser.role !== "super_admin") {
    return { redirect: { destination: "/books", permanent: false } };
  }
  return { props: { user: sanitizeUser(sessionUser) } };
};

export default function AdminUsersPage({ user }: { user: SafeUser }) {
  const [users, setUsers] = useState<AdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // 是否正在编辑当前登录的系统管理员：其状态和角色不允许修改
  const isSelfEdit = editing && form.id === user.id;

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin-users");
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(false);
    setForm(emptyForm);
    setError("");
    setOpen(true);
  };

  const openEdit = (item: AdminItem) => {
    setEditing(true);
    setForm({
      id: item.id,
      name: item.name,
      email: item.email,
      password: "",
      role: item.role,
      status: item.status,
    });
    setError("");
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setError("请填写姓名和邮箱");
      return;
    }
    setSaving(true);
    setError("");
    try {
      let res: Response;
      if (editing) {
        const body: Record<string, unknown> = {
          name: form.name,
          password: form.password || undefined,
        };
        // 编辑自己时不允许修改状态和角色
        if (!isSelfEdit) {
          body.role = form.role;
          body.status = form.status;
        }
        res = await fetch(`/api/admin-users/${form.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        if (!form.password) {
          setError("请设置初始密码");
          return;
        }
        res = await fetch("/api/admin-users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            password: form.password,
            role: form.role,
          }),
        });
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "操作失败");
        return;
      }
      setOpen(false);
      await load();
    } catch {
      setError("网络错误，请重试");
    } finally {
      setSaving(false);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AdminLayout user={user}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">管理员管理</h1>
            <p className="text-muted-foreground text-sm">
              管理系统管理员与普通管理员账号
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus /> 新增管理员
          </Button>
        </div>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>管理员列表</CardTitle>
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                placeholder="搜索姓名或邮箱..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="text-muted-foreground size-6 animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>管理员</TableHead>
                    <TableHead>邮箱</TableHead>
                    <TableHead>角色</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8">
                            <AvatarFallback className="bg-muted">
                              {initials(item.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{item.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{item.email}</TableCell>
                      <TableCell>
                        <Badge variant={item.role === "super_admin" ? "default" : "secondary"}>
                          {roleLabels[item.role]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.status === "active" ? "default" : "secondary"}>
                          {statusLabels[item.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(item.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(item)}
                        >
                          <Pencil /> 编辑
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-muted-foreground py-8 text-center">
                        未找到匹配的管理员
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger className="hidden" />
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editing ? "编辑管理员" : "新增管理员"}</DialogTitle>
              <DialogDescription>
                {editing
                  ? "修改管理员信息，密码留空则不修改"
                  : "创建新的管理员账号"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="f-name">姓名</Label>
                <Input
                  id="f-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="f-email">邮箱</Label>
                <Input
                  id="f-email"
                  type="email"
                  disabled={editing}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="f-password">
                  {editing ? "重置密码（留空则不变）" : "密码"}
                </Label>
                <Input
                  id="f-password"
                  type="password"
                  placeholder="至少 6 位"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="f-role">角色</Label>
                  <select
                    id="f-role"
                    value={form.role}
                    disabled={isSelfEdit}
                    onChange={(e) =>
                      setForm({ ...form, role: e.target.value as Role })
                    }
                    className="border-input bg-muted disabled:pointer-events-none flex h-9 w-full rounded-md border px-3 text-sm"
                  >
                    <option value="admin">管理员</option>
                    <option value="super_admin">系统管理员</option>
                  </select>
                </div>
                {editing && (
                  <div className="space-y-2">
                    <Label htmlFor="f-status">状态</Label>
                    <select
                      id="f-status"
                      value={form.status}
                      disabled={isSelfEdit}
                      onChange={(e) =>
                        setForm({ ...form, status: e.target.value as Status })
                      }
                      className="border-input bg-muted disabled:pointer-events-none flex h-9 w-full rounded-md border px-3 text-sm"
                    >
                      <option value="active">启用</option>
                      <option value="disabled">停用</option>
                    </select>
                  </div>
                )}
              </div>
              {isSelfEdit && (
                <p className="text-muted-foreground text-xs">
                  你正在编辑自己，角色和状态不可修改。
                </p>
              )}
              {error && <p className="text-destructive text-sm">{error}</p>}
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="size-4 animate-spin" />}
                保存
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}