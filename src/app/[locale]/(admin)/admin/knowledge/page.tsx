"use client";

import { useState, useEffect, useCallback } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

interface Entry {
  id: number;
  category: string;
  question: string;
  answer: string;
  language: "ru" | "kk";
}

interface FormState {
  id?: number;
  category: string;
  question: string;
  answer: string;
  language: "ru" | "kk";
}

const empty: FormState = { category: "general", question: "", answer: "", language: "ru" };

interface Settings {
  ai_tone?: string;
  ai_max_length?: string;
  ai_blocked_topics?: string;
  ai_system_prompt_general_ru?: string;
  ai_system_prompt_general_kk?: string;
}

export default function AdminKnowledgePage() {
  const [tab, setTab] = useState<"kb" | "prompts">("kb");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(empty);
  const [loading, setLoading] = useState(false);

  const [settings, setSettings] = useState<Settings>({});
  const [savingSettings, setSavingSettings] = useState(false);

  const reload = useCallback(async () => {
    const r = await fetch("/api/admin/knowledge");
    if (r.ok) setEntries((await r.json()).entries || []);
  }, []);
  const reloadSettings = useCallback(async () => {
    const r = await fetch("/api/admin/settings?group=ai");
    if (r.ok) setSettings(((await r.json()).settings || {}) as Settings);
  }, []);

  useEffect(() => {
    reload();
    reloadSettings();
  }, [reload, reloadSettings]);

  const openNew = () => { setForm(empty); setShowModal(true); };
  const openEdit = (e: Entry) => {
    setForm({ id: e.id, category: e.category, question: e.question, answer: e.answer, language: e.language });
    setShowModal(true);
  };

  const save = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/knowledge", {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (r.ok) { setShowModal(false); await reload(); }
      else alert("Ошибка сохранения");
    } finally { setLoading(false); }
  };
  const remove = async (id: number) => {
    if (!confirm("Удалить запись?")) return;
    await fetch(`/api/admin/knowledge?id=${id}`, { method: "DELETE" });
    reload();
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      const r = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (r.ok) await reloadSettings();
    } finally { setSavingSettings(false); }
  };

  const filtered = entries.filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return e.question.toLowerCase().includes(q) || e.answer.toLowerCase().includes(q) || e.category.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-purple-900">База знаний AI</h1>
        <div className="flex gap-2">
          <button onClick={() => setTab("kb")} className={`px-4 py-2 rounded-xl text-sm ${tab === "kb" ? "bg-purple-500 text-white" : "bg-white text-purple-700 border border-purple-200"}`}>FAQ-записи</button>
          <button onClick={() => setTab("prompts")} className={`px-4 py-2 rounded-xl text-sm ${tab === "prompts" ? "bg-purple-500 text-white" : "bg-white text-purple-700 border border-purple-200"}`}>Тон / запрещ. темы / prompts</button>
        </div>
      </div>

      {tab === "kb" && (
        <>
          <p className="text-sm text-gray-500">Эти записи используются как fallback при исчерпании лимита токенов и для подсказок чат-боту.</p>
          <div className="flex gap-2 items-center">
            <input
              placeholder="Поиск по вопросу/ответу/категории…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-2 rounded-xl border border-purple-200 focus:border-purple-500 focus:outline-none"
            />
            <Button onClick={openNew}>+ Запись</Button>
          </div>
          <Card className="p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-purple-50 border-b border-purple-100">
                <tr className="text-left text-xs uppercase tracking-wider text-purple-700">
                  <th className="px-4 py-3">Категория</th>
                  <th className="px-4 py-3">Lang</th>
                  <th className="px-4 py-3">Вопрос</th>
                  <th className="px-4 py-3">Ответ</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">Пусто</td></tr>
                ) : filtered.map((e) => (
                  <tr key={e.id} className="border-b border-gray-100 hover:bg-purple-50/30">
                    <td className="px-4 py-2"><span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">{e.category}</span></td>
                    <td className="px-4 py-2 font-mono text-xs">{e.language}</td>
                    <td className="px-4 py-2 max-w-[260px] truncate">{e.question}</td>
                    <td className="px-4 py-2 max-w-[300px] truncate text-gray-500">{e.answer}</td>
                    <td className="px-4 py-2 text-right space-x-2">
                      <button onClick={() => openEdit(e)} className="text-purple-600 hover:underline text-xs">Изменить</button>
                      <button onClick={() => remove(e.id)} className="text-red-500 hover:underline text-xs">Удалить</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}

      {tab === "prompts" && (
        <Card className="p-6 space-y-4">
          <div>
            <span className="text-sm font-medium text-gray-700">Тон общения</span>
            <input
              value={settings.ai_tone ?? ""}
              onChange={(e) => setSettings({ ...settings, ai_tone: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200"
            />
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700">Запрещённые темы (через запятую)</span>
            <input
              value={settings.ai_blocked_topics ?? ""}
              onChange={(e) => setSettings({ ...settings, ai_blocked_topics: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200"
            />
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700">Максимальная длина ответа (символов)</span>
            <input
              type="number"
              value={settings.ai_max_length ?? ""}
              onChange={(e) => setSettings({ ...settings, ai_max_length: e.target.value })}
              className="mt-1 w-32 px-3 py-2 rounded-lg border border-gray-200"
            />
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700">System prompt — general (RU)</span>
            <textarea
              rows={5}
              value={settings.ai_system_prompt_general_ru ?? ""}
              onChange={(e) => setSettings({ ...settings, ai_system_prompt_general_ru: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 font-mono text-sm"
            />
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700">System prompt — general (KK)</span>
            <textarea
              rows={5}
              value={settings.ai_system_prompt_general_kk ?? ""}
              onChange={(e) => setSettings({ ...settings, ai_system_prompt_general_kk: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 font-mono text-sm"
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={saveSettings} loading={savingSettings}>Сохранить</Button>
          </div>
        </Card>
      )}

      {showModal && (
        <Modal isOpen onClose={() => setShowModal(false)} title={form.id ? "Изменить запись" : "Новая запись"}>
          <div className="space-y-3">
            <Field label="Категория" value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Язык</span>
              <select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value as "ru" | "kk" })} className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200">
                <option value="ru">Русский</option>
                <option value="kk">Қазақша</option>
              </select>
            </label>
            <Field label="Вопрос" value={form.question} onChange={(v) => setForm({ ...form, question: v })} />
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Ответ</span>
              <textarea
                value={form.answer}
                onChange={(e) => setForm({ ...form, answer: e.target.value })}
                rows={5}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200"
              />
            </label>
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

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200" />
    </label>
  );
}
