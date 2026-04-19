"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";

interface EventItem {
  id: number;
  title_ru: string;
  title_kk: string | null;
  description_ru: string | null;
  description_kk: string | null;
  image_url: string | null;
  event_type: "workshop" | "author_meeting" | "contest" | "exhibition" | "reading";
  start_date: string;
  end_date: string | null;
  location: string | null;
  age_group: "6-9" | "10-13" | "14-17" | "all";
  max_participants: number | null;
  status: "active" | "cancelled" | "completed";
}

const EMPTY: Partial<EventItem> = {
  title_ru: "",
  title_kk: "",
  event_type: "workshop",
  start_date: "",
  age_group: "all",
  status: "active",
};

const TYPES = ["workshop", "author_meeting", "contest", "exhibition", "reading"] as const;

export default function AdminEventsPage() {
  const params = useParams();
  const locale = (params?.locale as string) ?? "ru";
  const kk = locale === "kk";
  const [items, setItems] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<EventItem> | null>(null);
  const [saving, setSaving] = useState(false);
  const [posterSvg, setPosterSvg] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const load = async () => {
    setLoading(true);
    const r = await fetch("/api/events");
    if (r.ok) setItems((await r.json()).events ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing?.title_ru || !editing?.start_date || !editing?.event_type) return;
    setSaving(true);
    const method = editing.id ? "PUT" : "POST";
    await fetch("/api/events", {
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
    await fetch(`/api/events?id=${id}`, { method: "DELETE" });
    load();
  };

  const generatePoster = async () => {
    if (!editing?.title_ru) return;
    setGenerating(true);
    try {
      const r = await fetch("/api/posters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editing.title_ru,
          description: editing.description_ru ?? "",
          date: editing.start_date ?? "",
          style: "bright",
          language: "ru",
        }),
      });
      if (r.ok) {
        const data = await r.json();
        setPosterSvg(data.svg);
      }
    } finally {
      setGenerating(false);
    }
  };

  const savePosterAsImage = () => {
    if (!posterSvg) return;
    const blob = new Blob([posterSvg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `poster-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-purple-900">{kk ? "Оқиғалар" : "События"}</h1>
        <Button onClick={() => setEditing(EMPTY)}>{kk ? "Оқиға қосу" : "Добавить событие"}</Button>
      </div>

      {loading ? (
        <p className="text-gray-400">{kk ? "Жүктелуде…" : "Загрузка…"}</p>
      ) : (
        <div className="space-y-3">
          {items.map((ev) => (
            <Card key={ev.id} className="p-4 flex items-center justify-between">
              <div className="min-w-0">
                <h3 className="font-medium text-purple-900 truncate">{ev.title_ru}</h3>
                <p className="text-sm text-gray-400">
                  {new Date(ev.start_date).toLocaleString(kk ? "kk-KZ" : "ru-RU")}
                  {ev.location ? ` · ${ev.location}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="success">{ev.event_type}</Badge>
                <Badge variant="info">{ev.age_group}</Badge>
                <Button variant="ghost" size="sm" onClick={() => setEditing(ev)}>{kk ? "Өңдеу" : "Правка"}</Button>
                <Button variant="danger" size="sm" onClick={() => remove(ev.id)}>{kk ? "Жою" : "Удалить"}</Button>
              </div>
            </Card>
          ))}
          {items.length === 0 && <Card className="p-6 text-center text-gray-400">—</Card>}
        </div>
      )}

      {editing && (
        <Modal isOpen={true} onClose={() => { setEditing(null); setPosterSvg(null); }} size="xl" title={editing.id ? (kk ? "Өңдеу" : "Редактировать") : (kk ? "Жаңа оқиға" : "Новое событие")}>
          <div className="space-y-3">
            <Input label="Title (RU)" value={editing.title_ru ?? ""} onChange={(e) => setEditing({ ...editing, title_ru: e.target.value })} />
            <Input label="Title (KK)" value={editing.title_kk ?? ""} onChange={(e) => setEditing({ ...editing, title_kk: e.target.value })} />
            <div>
              <label className="text-sm text-gray-600 block mb-1">Description (RU)</label>
              <textarea value={editing.description_ru ?? ""} onChange={(e) => setEditing({ ...editing, description_ru: e.target.value })} rows={3} className="w-full rounded-xl border border-purple-200 px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-600 block mb-1">{kk ? "Түрі" : "Тип"}</label>
                <select value={editing.event_type ?? "workshop"} onChange={(e) => setEditing({ ...editing, event_type: e.target.value as EventItem["event_type"] })} className="w-full rounded-xl border border-purple-200 px-3 py-2 text-sm bg-white">
                  {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">{kk ? "Жас" : "Возраст"}</label>
                <select value={editing.age_group ?? "all"} onChange={(e) => setEditing({ ...editing, age_group: e.target.value as EventItem["age_group"] })} className="w-full rounded-xl border border-purple-200 px-3 py-2 text-sm bg-white">
                  <option value="all">all</option>
                  <option value="6-9">6-9</option>
                  <option value="10-13">10-13</option>
                  <option value="14-17">14-17</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">{kk ? "Басталуы" : "Начало"}</label>
                <input type="datetime-local" value={editing.start_date?.slice(0, 16) ?? ""} onChange={(e) => setEditing({ ...editing, start_date: e.target.value })} className="w-full rounded-xl border border-purple-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">{kk ? "Аяқталуы" : "Конец"}</label>
                <input type="datetime-local" value={editing.end_date?.slice(0, 16) ?? ""} onChange={(e) => setEditing({ ...editing, end_date: e.target.value })} className="w-full rounded-xl border border-purple-200 px-3 py-2 text-sm" />
              </div>
              <Input label={kk ? "Орны" : "Место"} value={editing.location ?? ""} onChange={(e) => setEditing({ ...editing, location: e.target.value })} />
              <Input label={kk ? "Макс.қатысушылар" : "Макс. участников"} type="number" value={editing.max_participants ?? ""} onChange={(e) => setEditing({ ...editing, max_participants: e.target.value ? parseInt(e.target.value, 10) : undefined })} />
            </div>

            <div className="border-t border-gray-100 pt-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-bold text-purple-900">{kk ? "ИИ-афиша" : "ИИ-афиша"}</div>
                <Button size="sm" variant="ghost" onClick={generatePoster} disabled={!editing.title_ru || generating}>
                  {generating ? "..." : kk ? "Жасау" : "Сгенерировать"}
                </Button>
              </div>
              {posterSvg && (
                <div className="space-y-2">
                  <div className="bg-gray-50 rounded-xl p-2 max-h-60 overflow-auto" dangerouslySetInnerHTML={{ __html: posterSvg }} />
                  <Button size="sm" variant="primary" onClick={savePosterAsImage}>
                    {kk ? "SVG жүктеу" : "Скачать SVG"}
                  </Button>
                </div>
              )}
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
