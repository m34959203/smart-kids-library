"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";

interface Book {
  id: number;
  title: string;
  author: string;
  genre: string | null;
  age_category: string | null;
  language: string | null;
  is_available: boolean;
  cover_url?: string | null;
  description?: string | null;
  year?: number | null;
  isbn?: string | null;
  file_url?: string | null;
  page_count?: number | null;
}

const EMPTY: Partial<Book> = { title: "", author: "", genre: "", age_category: "", language: "ru", is_available: true };

export default function AdminCatalogPage() {
  const params = useParams();
  const locale = (params?.locale as string) ?? "ru";
  const kk = locale === "kk";
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Book> | null>(null);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/catalog?page=${page}&limit=50`);
    const data = await res.json();
    setBooks(data.books ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const save = async () => {
    if (!editing?.title || !editing?.author) return;
    setSaving(true);
    const body: Partial<Book> = {
      ...editing,
      genre: editing.genre || undefined,
      age_category: editing.age_category || undefined,
    };
    const method = editing.id ? "PUT" : "POST";
    await fetch("/api/admin/books", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    setEditing(null);
    load();
  };

  const remove = async (id: number) => {
    if (!confirm(kk ? "Жою керек пе?" : "Удалить?")) return;
    await fetch(`/api/admin/books?id=${id}`, { method: "DELETE" });
    load();
  };

  const uploadCover = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("kind", "cover");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (!res.ok) return;
    const data = await res.json();
    setEditing((e) => ({ ...(e ?? {}), cover_url: data.url }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-purple-900">{kk ? "Кітаптар каталогы" : "Каталог книг"}</h1>
        <Button onClick={() => setEditing(EMPTY)}>{kk ? "Кітап қосу" : "Добавить книгу"}</Button>
      </div>

      {loading ? (
        <p className="text-gray-400">{kk ? "Жүктелуде…" : "Загрузка…"}</p>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-purple-50">
              <tr>
                <th className="text-left p-3 text-purple-700">ID</th>
                <th className="text-left p-3 text-purple-700">{kk ? "Атауы" : "Название"}</th>
                <th className="text-left p-3 text-purple-700">{kk ? "Автор" : "Автор"}</th>
                <th className="text-left p-3 text-purple-700">{kk ? "Жанр" : "Жанр"}</th>
                <th className="text-left p-3 text-purple-700">{kk ? "Жас" : "Возраст"}</th>
                <th className="text-left p-3 text-purple-700">{kk ? "Статус" : "Статус"}</th>
                <th className="text-right p-3 text-purple-700"></th>
              </tr>
            </thead>
            <tbody>
              {books.map((b) => (
                <tr key={b.id} className="border-t border-gray-100 hover:bg-purple-50/50">
                  <td className="p-3">{b.id}</td>
                  <td className="p-3 font-medium">{b.title}</td>
                  <td className="p-3 text-gray-500">{b.author}</td>
                  <td className="p-3">{b.genre ?? "—"}</td>
                  <td className="p-3">{b.age_category ?? "—"}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${b.is_available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {b.is_available ? (kk ? "Бар" : "Доступна") : (kk ? "Жоқ" : "Недоступна")}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => setEditing(b)}>{kk ? "Өңдеу" : "Правка"}</Button>
                    <Button variant="danger" size="sm" onClick={() => remove(b.id)}>{kk ? "Жою" : "Удалить"}</Button>
                  </td>
                </tr>
              ))}
              {books.length === 0 && (
                <tr><td colSpan={7} className="p-6 text-center text-gray-400">—</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      <div className="flex justify-between text-sm text-gray-500">
        <span>{kk ? "Барлығы" : "Всего"}: {total}</span>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>←</Button>
          <span>{page}</span>
          <Button size="sm" variant="ghost" disabled={page * 50 >= total} onClick={() => setPage((p) => p + 1)}>→</Button>
        </div>
      </div>

      {editing && (
        <Modal isOpen={true} onClose={() => setEditing(null)} size="xl" title={editing.id ? (kk ? "Кітапты өңдеу" : "Редактировать книгу") : (kk ? "Жаңа кітап" : "Новая книга")}>
          <div className="space-y-3">
            <Input label={kk ? "Атауы" : "Название"} value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
            <Input label={kk ? "Автор" : "Автор"} value={editing.author ?? ""} onChange={(e) => setEditing({ ...editing, author: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input label={kk ? "Жанр" : "Жанр"} value={editing.genre ?? ""} onChange={(e) => setEditing({ ...editing, genre: e.target.value })} />
              <div>
                <label className="text-sm text-gray-600 block mb-1">{kk ? "Жас" : "Возраст"}</label>
                <select
                  value={editing.age_category ?? ""}
                  onChange={(e) => setEditing({ ...editing, age_category: e.target.value || undefined })}
                  className="w-full rounded-xl border border-purple-200 px-3 py-2 text-sm bg-white"
                >
                  <option value="">—</option>
                  <option value="6-9">6-9</option>
                  <option value="10-13">10-13</option>
                  <option value="14-17">14-17</option>
                </select>
              </div>
              <Input label="ISBN" value={editing.isbn ?? ""} onChange={(e) => setEditing({ ...editing, isbn: e.target.value })} />
              <Input label={kk ? "Жыл" : "Год"} type="number" value={editing.year ?? ""} onChange={(e) => setEditing({ ...editing, year: e.target.value ? parseInt(e.target.value, 10) : undefined })} />
              <div>
                <label className="text-sm text-gray-600 block mb-1">{kk ? "Тіл" : "Язык"}</label>
                <select
                  value={editing.language ?? "ru"}
                  onChange={(e) => setEditing({ ...editing, language: e.target.value })}
                  className="w-full rounded-xl border border-purple-200 px-3 py-2 text-sm bg-white"
                >
                  <option value="ru">RU</option>
                  <option value="kk">KK</option>
                </select>
              </div>
              <Input label={kk ? "Беттер" : "Страниц"} type="number" value={editing.page_count ?? ""} onChange={(e) => setEditing({ ...editing, page_count: e.target.value ? parseInt(e.target.value, 10) : undefined })} />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">{kk ? "Сипаттама" : "Описание"}</label>
              <textarea
                value={editing.description ?? ""}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                rows={4}
                className="w-full rounded-xl border border-purple-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">{kk ? "Мұқаба" : "Обложка"}</label>
              <div className="flex items-center gap-3">
                {editing.cover_url && <img src={editing.cover_url} alt="" className="w-16 h-20 object-cover rounded" />}
                <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadCover(e.target.files[0])} />
              </div>
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={editing.is_available ?? true} onChange={(e) => setEditing({ ...editing, is_available: e.target.checked })} />
              <span className="text-sm">{kk ? "Қолжетімді" : "Доступна"}</span>
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setEditing(null)}>{kk ? "Болдырмау" : "Отмена"}</Button>
              <Button onClick={save} disabled={saving}>{saving ? "..." : kk ? "Сақтау" : "Сохранить"}</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
