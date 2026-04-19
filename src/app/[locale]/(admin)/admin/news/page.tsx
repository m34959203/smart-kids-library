"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";

interface NewsItem {
  id: number;
  slug: string;
  title_ru: string;
  title_kk: string | null;
  content_ru: string | null;
  content_kk: string | null;
  excerpt_ru: string | null;
  excerpt_kk: string | null;
  image_url: string | null;
  category: string | null;
  status: "draft" | "published" | "archived";
  published_at: string | null;
  created_at: string;
}

const EMPTY: Partial<NewsItem> = { title_ru: "", title_kk: "", content_ru: "", content_kk: "", status: "draft" };

export default function AdminNewsPage() {
  const params = useParams();
  const locale = (params?.locale as string) ?? "ru";
  const kk = locale === "kk";
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<NewsItem> | null>(null);
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);

  const load = async () => {
    setLoading(true);
    const r = await fetch("/api/news?drafts=true&limit=100");
    if (r.ok) setItems((await r.json()).news ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing?.title_ru) return;
    setSaving(true);
    const method = editing.id ? "PUT" : "POST";
    await fetch("/api/news", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    setSaving(false);
    setEditing(null);
    load();
  };

  const remove = async (id: number) => {
    if (!confirm(kk ? "Жою керек пе?" : "Удалить?")) return;
    await fetch(`/api/news?id=${id}`, { method: "DELETE" });
    load();
  };

  const autoTranslate = async (field: "title" | "content", fromText: string) => {
    if (!fromText) return;
    setTranslating(true);
    try {
      const r = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: fromText, from: "ru", to: "kk" }),
      });
      if (r.ok) {
        const data = await r.json();
        setEditing((e) => ({ ...(e ?? {}), [`${field}_kk`]: data.translated }));
      }
    } finally {
      setTranslating(false);
    }
  };

  const uploadImage = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("kind", "news");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (res.ok) {
      const data = await res.json();
      setEditing((e) => ({ ...(e ?? {}), image_url: data.url }));
    }
  };

  const publishSocial = async (item: NewsItem) => {
    await fetch("/api/social/post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contentType: "news",
        contentId: item.id,
        platform: ["telegram", "instagram"],
        title: item.title_ru,
        description: item.excerpt_ru ?? (item.content_ru ?? "").slice(0, 300),
        imageUrl: item.image_url,
      }),
    });
    alert(kk ? "Жіберілді!" : "Опубликовано!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-purple-900">{kk ? "Жаңалықтар" : "Новости"}</h1>
        <Button onClick={() => setEditing(EMPTY)}>{kk ? "Жаңалық қосу" : "Добавить новость"}</Button>
      </div>

      {loading ? (
        <p className="text-gray-400">{kk ? "Жүктелуде…" : "Загрузка…"}</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id} className="p-4 flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-purple-900 truncate">{item.title_ru}</h3>
                <p className="text-sm text-gray-400">{new Date(item.created_at).toLocaleDateString(kk ? "kk-KZ" : "ru-RU")}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`px-2 py-0.5 rounded-full text-xs ${item.status === "published" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                  {item.status}
                </span>
                <Button variant="ghost" size="sm" onClick={() => setEditing(item)}>{kk ? "Өңдеу" : "Правка"}</Button>
                {item.status === "published" && (
                  <Button variant="primary" size="sm" onClick={() => publishSocial(item)}>
                    {kk ? "SMM" : "SMM"}
                  </Button>
                )}
                <Button variant="danger" size="sm" onClick={() => remove(item.id)}>{kk ? "Жою" : "Удалить"}</Button>
              </div>
            </Card>
          ))}
          {items.length === 0 && <Card className="p-6 text-center text-gray-400">—</Card>}
        </div>
      )}

      {editing && (
        <Modal isOpen={true} onClose={() => setEditing(null)} size="xl" title={editing.id ? (kk ? "Өңдеу" : "Редактировать") : (kk ? "Жаңа" : "Новая")}>
          <div className="space-y-3">
            <Input label="Title (RU)" value={editing.title_ru ?? ""} onChange={(e) => setEditing({ ...editing, title_ru: e.target.value })} />
            <div>
              <Input label="Title (KK)" value={editing.title_kk ?? ""} onChange={(e) => setEditing({ ...editing, title_kk: e.target.value })} />
              <button
                type="button"
                onClick={() => autoTranslate("title", editing.title_ru ?? "")}
                disabled={translating}
                className="text-xs text-purple-600 underline mt-1"
              >
                {translating ? "…" : kk ? "RU-дан аудару" : "Авто-перевод с RU"}
              </button>
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Content (RU)</label>
              <textarea
                value={editing.content_ru ?? ""}
                onChange={(e) => setEditing({ ...editing, content_ru: e.target.value })}
                rows={6}
                className="w-full rounded-xl border border-purple-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Content (KK)</label>
              <textarea
                value={editing.content_kk ?? ""}
                onChange={(e) => setEditing({ ...editing, content_kk: e.target.value })}
                rows={6}
                className="w-full rounded-xl border border-purple-200 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => autoTranslate("content", editing.content_ru ?? "")}
                disabled={translating}
                className="text-xs text-purple-600 underline mt-1"
              >
                {translating ? "…" : kk ? "RU-дан аудару" : "Авто-перевод с RU"}
              </button>
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">{kk ? "Сурет" : "Изображение"}</label>
              <div className="flex items-center gap-3">
                {editing.image_url && <img src={editing.image_url} alt="" className="w-24 h-16 object-cover rounded" />}
                <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label={kk ? "Санат" : "Категория"} value={editing.category ?? ""} onChange={(e) => setEditing({ ...editing, category: e.target.value })} />
              <div>
                <label className="text-sm text-gray-600 block mb-1">{kk ? "Статус" : "Статус"}</label>
                <select
                  value={editing.status ?? "draft"}
                  onChange={(e) => setEditing({ ...editing, status: e.target.value as NewsItem["status"] })}
                  className="w-full rounded-xl border border-purple-200 px-3 py-2 text-sm bg-white"
                >
                  <option value="draft">draft</option>
                  <option value="published">published</option>
                  <option value="archived">archived</option>
                </select>
              </div>
            </div>
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
