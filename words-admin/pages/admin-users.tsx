"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminLayout } from "@/components/admin-layout";

type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: "超级管理员" | "管理员";
  status: "启用" | "停用";
  createdAt: string;
};

const initialUsers: AdminUser[] = [
  { id: 1, name: "张伟", email: "zhangwei@example.com", role: "超级管理员", status: "启用", createdAt: "2026-07-01" },
  { id: 2, name: "李娜", email: "lina@example.com", role: "管理员", status: "启用", createdAt: "2026-07-12" },
  { id: 3, name: "王强", email: "wangqiang@example.com", role: "管理员", status: "启用", createdAt: "2026-07-20" },
  { id: 4, name: "赵敏", email: "zhaomin@example.com", role: "管理员", status: "停用", createdAt: "2026-08-02" },
];

function initials(name: string) {
  return (name || "?").slice(0, 1).toUpperCase();
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [query, setQuery] = useState("");

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">管理员管理</h1>
            <p className="text-muted-foreground text-sm">管理系统管理员账号</p>
          </div>
          <Button onClick={() => setUsers((prev) => [
            { id: Date.now(), name: "新管理员", email: "new@example.com", role: "管理员", status: "启用", createdAt: "2026-08-26" },
            ...prev,
          ])}>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>管理员</TableHead>
                  <TableHead>邮箱</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback className="bg-muted">
                            {initials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "超级管理员" ? "default" : "secondary"}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === "启用" ? "default" : "secondary"}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.createdAt}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                      未找到匹配的管理员
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}