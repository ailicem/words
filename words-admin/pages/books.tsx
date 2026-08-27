import { useCallback, useEffect, useState } from "react";
import type { GetServerSideProps } from "next";
import { Loader2, Pencil, Plus, Search, BookOpen, Trash2 } from "lucide-react";
import type { SafeUser } from "@/lib/types";
import { sanitizeUser, getSessionUser } from "@/lib/server/auth";
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

type BookItem = {
  id: number;
  title: string;
  wordCount: number;
  coverUrl: string | null;
  bookId: string;
  tags: string | null;
  createdAt: string;
  updatedAt: string;
};

type FormState = {
  id?: number;
  title: string;
  wordCount: string;
  coverUrl: string;
  bookId: string;
  tags: string;
};

const emptyForm: FormState = {
  title: "",
  wordCount: "",
  coverUrl: "",
  bookId: "",
  tags: "",
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const sessionUser = await getSessionUser(ctx.req);
  if (!sessionUser) {
    return { redirect: { destination: "/signin", permanent: false } };
  }
  return { props: { user: sanitizeUser(sessionUser) } };
};

export default function BooksPage({ user }: { user: SafeUser }) {
  const [books, setBooks] = useState<BookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/books");
    if (res.ok) {
      const data = await res.json();
      setBooks(data.books ?? []);
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

  const openEdit = (item: BookItem) => {
    setEditing(true);
    setForm({
      id: item.id,
      title: item.title,
      wordCount: String(item.wordCount),
      coverUrl: item.coverUrl ?? "",
      bookId: item.bookId,
      tags: item.tags ?? "",
    });
    setError("");
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.bookId.trim()) {
      setError("请填写单词书标题和 bookId");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        title: form.title,
        wordCount: form.wordCount,
        coverUrl: form.coverUrl,
        bookId: form.bookId,
        tags: form.tags,
      };
      const res = editing
        ? await fetch(`/api/books/${form.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/books", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
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

  const handleDelete = async (book: BookItem) => {
    if (!window.confirm(`确定删除单词书「${book.title}」吗？\n该操作会同时删除同 bookId 下的所有单词，且不可恢复。`)) {
      return;
    }
    const res = await fetch(`/api/books/${book.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      alert(data?.message ?? "删除失败");
      return;
    }
    await load();
  };

  const filtered = books.filter((b) =>
    b.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AdminLayout user={user}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">单词书管理</h1>
            <p className="text-muted-foreground text-sm">
              管理单词书，并通过 bookId 关联对应的单词数据
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus /> 新增单词书
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
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="text-muted-foreground size-6 animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">封面</TableHead>
                    <TableHead>标题</TableHead>
                    <TableHead>单词数量</TableHead>
                    <TableHead>bookId</TableHead>
                    <TableHead>标签</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((book) => (
                    <TableRow key={book.id}>
                      <TableCell>
                        {book.coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={book.coverUrl}
                            alt={book.title}
                            className="bg-muted size-10 rounded object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="bg-muted flex size-10 items-center justify-center rounded">
                            <BookOpen className="text-muted-foreground size-5" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{book.title}</TableCell>
                      <TableCell>{book.wordCount}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {book.bookId}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {book.tags?.split(",").filter(Boolean).join("、") || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(book)}
                          >
                            <Pencil /> 编辑
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(book)}
                          >
                            <Trash2 /> 删除
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-muted-foreground py-8 text-center"
                      >
                        未找到匹配的单词书
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
              <DialogTitle>{editing ? "编辑单词书" : "新增单词书"}</DialogTitle>
              <DialogDescription>
                {editing ? "修改单词书信息" : "创建一本新的单词书"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="b-title">标题</Label>
                <Input
                  id="b-title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="如：初中英语词汇"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="b-wordCount">单词数量</Label>
                <Input
                  id="b-wordCount"
                  type="number"
                  min={0}
                  value={form.wordCount}
                  onChange={(e) => setForm({ ...form, wordCount: e.target.value })}
                  placeholder="如：1600"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="b-coverUrl">封面 URL</Label>
                <Input
                  id="b-coverUrl"
                  type="url"
                  value={form.coverUrl}
                  onChange={(e) => setForm({ ...form, coverUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="b-bookId">bookId</Label>
                <Input
                  id="b-bookId"
                  value={form.bookId}
                  onChange={(e) => setForm({ ...form, bookId: e.target.value })}
                  placeholder="如：PEPXiaoXue3_1"
                />
                <p className="text-muted-foreground text-xs">
                  用于关联 words 表中对应单词（如 PEPXiaoXue3_1）
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="b-tags">标签（逗号分隔）</Label>
                <Input
                  id="b-tags"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="如：三年级,人教版,PEP"
                />
              </div>
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