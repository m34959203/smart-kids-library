"use client";

import { useState, useEffect, useCallback } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

interface CmsRow {
  id: number;
  slug: string;
  title_ru: string;
  title_kk: string | null;
  updated_at: string;
}

interface FormState {
  id?: number;
  slug: string;
  title_ru: string;
  title_kk: string;
  content_ru: string;
  content_kk: string;
  meta_description_ru: string;
  meta_description_kk: string;
}

const empty: FormState = {
  slug: "",
  title_ru: "",
  title_kk: "",
  content_ru: "",
  content_kk: "",
  meta_description_ru: "",
  meta_description_kk: "",
};

export default function AdminPagesPage() {
  const [pages, setPages] = useState<CmsRow[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(empty);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    const r = await fetch("/api/admin/cms");
    if (r.ok) setPages((await r.json()).pages || []);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const openNew = () => {
    setForm(empty);
    setShowModal(true);
  };

  const openEdit = async (slug: string) => {
    const r = await fetch(`/api/admin/cms?slug=${encodeURIComponent(slug)}`);
    if (!r.ok) return;
    const p = (await r.json()).page;
    setForm({
      id: p.id,
      slug: p.slug,
      title_ru: p.title_ru ?? "",
      title_kk: p.title_kk ?? "",
      content_ru: p.content_ru ?? "",
      content_kk: p.content_kk ?? "",
      meta_description_ru: p.meta_description_ru ?? "",
      meta_description_kk: p.meta_description_kk ?? "",
    });
    setShowModal(true);
  };

  const save = async () => {
    setLoading(true);
    try {
      const url = "/api/admin/cms";
      const method = form.id ? "PUT" : "POST";
      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (r.ok) {
        setShowModal(false);
        await reload();
      } else {
        alert("Ошибка сохранения");
      }
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Удалить страницу?")) return;
    await fetch(`/api/admin/cms?id=${id}`, { method: "DELETE" });
    reload();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-purple-900">CMS — статичные страницы</h1>
          <p className="text-sm text-gray-500 mt-1">О библиотеке, правила, электронные ресурсы и т.п.</p>
        </div>
        <Button onClick={openNew}>+ Страница</Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-purple-50 border-b border-purple-100">
            <tr className="text-left text-xs uppercase tracking-wider text-purple-700">
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Заголовок (RU)</th>
              <th className="px-4 py-3">Заголовок (KK)</th>
              <th className="px-4 py-3">Обновлено</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {pages.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">Пусто</td></tr>
            ) : pages.map((p) => (
              <tr key={p.id} className="border-b border-gray-100 hover:bg-purple-50/30">
                <td className="px-4 py-3 font-mono text-xs">/{p.slug}</td>
                <td className="px-4 py-3 font-medium">{p.title_ru}</td>
                <td className="px-4 py-3 text-gray-500">{p.title_kk}</td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {new Date(p.updated_at).toLocaleString("ru-RU")}
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => openEdit(p.slug)} className="text-purple-600 hover:underline text-sm">Изменить</button>
                  <button onClick={() => remove(p.id)} className="text-red-500 hover:underline text-sm">Удалить</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {showModal && (
        <Modal isOpen onClose={() => setShowModal(false)} title={form.id ? "Редактировать страницу" : "Новая страница"}>
          <div className="space-y-3">
            <Field label="Slug" value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} mono />
            <Field label="Заголовок (RU)" value={form.title_ru} onChange={(v) => setForm({ ...form, title_ru: v })} />
            <Field label="Заголовок (KK)" value={form.title_kk} onChange={(v) => setForm({ ...form, title_kk: v })} />
            <TextareaField label="Контент (RU, HTML)" value={form.content_ru} onChange={(v) => setForm({ ...form, content_ru: v })} rows={10} />
            <TextareaField label="Контент (KK, HTML)" value={form.content_kk} onChange={(v) => setForm({ ...form, content_kk: v })} rows={10} />
            <Field label="Meta description (RU)" value={form.meta_description_ru} onChange={(v) => setForm({ ...form, meta_description_ru: v })} />
            <Field label="Meta description (KK)" value={form.meta_description_kk} onChange={(v) => setForm({ ...form, meta_description_kk: v })} />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>Отмена</Button>
              <Button onClick={save} loading={loading}>Сохранить</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Field({ label, value, onChange, mono }: { label: string; value: string; onChange: (v: string) => void; mono?: boolean }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-500 focus:outline-none ${mono ? "font-mono text-sm" : ""}`}
      />
    </label>
  );
}

function TextareaField({ label, value, onChange, rows = 4 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-500 focus:outline-none font-mono text-sm"
      />
    </label>
  );
}
