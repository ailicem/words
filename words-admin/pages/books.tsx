import { useState } from "react";
import type { GetServerSideProps } from "next";
import { Plus, Search } from "lucide-react";
import type { SafeUser } from "@/lib/types";
import { sanitizeUser, getSessionUser } from "@/lib/server/auth";
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

type Book = {
  id: number;
  title: string;
  words: number;
  level: "初中" | "高中" | "四级" | "六级" | "考研";
  status: "启用" | "停用";
  updatedAt: string;
};

const initialBooks: Book[] = [
  { id: 1, title: "初中英语词汇", words: 1600, level: "初中", status: "启用", updatedAt: "2026-08-01" },
  { id: 2, title: "高中英语词汇", words: 3500, level: "高中", status: "启用", updatedAt: "2026-08-05" },
  { id: 3, title: "四级核心词汇", words: 2200, level: "四级", status: "启用", updatedAt: "2026-08-10" },
  { id: 4, title: "六级高频词汇", words: 1800, level: "六级", status: "停用", updatedAt: "2026-08-12" },
  { id: 5, title: "考研必考词汇", words: 3000, level: "考研", status: "启用", updatedAt: "2026-08-15" },
];

const levelColors: Record<Book["level"], "secondary" | "default" | "outline"> = {
  初中: "secondary",
  高中: "default",
  四级: "secondary",
  六级: "outline",
  考研: "default",
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const sessionUser = await getSessionUser(ctx.req);
  if (!sessionUser) {
    return { redirect: { destination: "/signin", permanent: false } };
  }
  return { props: { user: sanitizeUser(sessionUser) } };
};

export default function BooksPage({ user }: { user: SafeUser }) {
  const [books, setBooks] = useState<Book[]>(initialBooks);
  const [query, setQuery] = useState("");

  const filtered = books.filter((b) =>
    b.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AdminLayout user={user}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">单词书管理</h1>
            <p className="text-muted-foreground text-sm">管理单词书及其词汇内容</p>
          </div>
          <Button onClick={() => setBooks((prev) => [
            { id: Date.now(), title: "新单词书", words: 0, level: "四级", status: "停用", updatedAt: "2026-08-26" },
            ...prev,
          ])}>
            <Plus /> 新建单词书
          </Button>
        </div>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>单词书列表</CardTitle>
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                placeholder="搜索书名..."
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
                  <TableHead>书名</TableHead>
                  <TableHead>词汇数</TableHead>
                  <TableHead>级别</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>更新时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((book) => (
                  <TableRow key={book.id}>
                    <TableCell className="font-medium">{book.title}</TableCell>
                    <TableCell>{book.words}</TableCell>
                    <TableCell>
                      <Badge variant={levelColors[book.level]}>{book.level}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={book.status === "启用" ? "default" : "secondary"}>
                        {book.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{book.updatedAt}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                      未找到匹配的单词书
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