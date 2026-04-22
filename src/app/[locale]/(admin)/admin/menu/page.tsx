"use client";

import { useState, useEffect, useCallback } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

interface MenuItem {
  id: number;
  age_profile: "6-9" | "10-13" | "14-17" | "default";
  label_ru: string;
  label_kk: string | null;
  href: string;
  icon: string | null;
  sort_order: number;
  visible: boolean;
}

interface FormState {
  id?: number;
  age_profile: "6-9" | "10-13" | "14-17" | "default";
  label_ru: string;
  label_kk: string;
  href: string;
  icon: string;
  sort_order: number;
  visible: boolean;
}

const empty: FormState = {
  age_profile: "default",
  label_ru: "",
  label_kk: "",
  href: "",
  icon: "",
  sort_order: 0,
  visible: true,
};

export default function AdminMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(empty);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    const r = await fetch("/api/admin/menu");
    if (r.ok) setItems((await r.json()).items || []);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const openNew = () => {
    setForm(empty);
    setShowModal(true);
  };

  const openEdit = (it: MenuItem) => {
    setForm({
      id: it.id,
      age_profile: it.age_profile,
      label_ru: it.label_ru,
      label_kk: it.label_kk ?? "",
      href: it.href,
      icon: it.icon ?? "",
      sort_order: it.sort_order,
      visible: it.visible,
    });
    setShowModal(true);
  };

  const save = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/menu", {
        method: form.id ? "PUT" : "POST",
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
    if (!confirm("Удалить пункт меню?")) return;
    await fetch(`/api/admin/menu?id=${id}`, { method: "DELETE" });
    reload();
  };

  const grouped = (["6-9", "10-13", "14-17", "default"] as const).map((p) => ({
    profile: p,
    items: items.filter((i) => i.age_profile === p),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-purple-900">Меню навигации</h1>
          <p className="text-sm text-gray-500 mt-1">Дополнительные пункты для возрастных профилей. Базовое меню встроено в код, эти пункты прибавляются.</p>
        </div>
        <Button onClick={openNew}>+ Пункт</Button>
      </div>

      {grouped.map(({ profile, items: list }) => (
        <Card key={profile} className="p-0 overflow-hidden">
          <div className="bg-purple-50 px-4 py-2 font-bold text-purple-700 text-sm">
            Профиль: {profile}
          </div>
          <table className="w-full text-sm">
            <tbody>
              {list.length === 0 ? (
                <tr><td className="px-4 py-4 text-gray-400 text-center">Пусто</td></tr>
              ) : list.map((it) => (
                <tr key={it.id} className="border-b border-gray-100 last:border-b-0">
                  <td className="px-4 py-2 w-12 text-gray-400">{it.sort_order}</td>
                  <td className="px-4 py-2 font-medium">{it.label_ru}</td>
                  <td className="px-4 py-2 text-gray-500">{it.label_kk}</td>
                  <td className="px-4 py-2 font-mono text-xs text-gray-400">{it.href}</td>
                  <td className="px-4 py-2 text-xs">
                    <span className={it.visible ? "text-green-600" : "text-gray-400"}>{it.visible ? "видим" : "скрыт"}</span>
                  </td>
                  <td className="px-4 py-2 text-right space-x-2">
                    <button onClick={() => openEdit(it)} className="text-purple-600 hover:underline text-xs">Изменить</button>
                    <button onClick={() => remove(it.id)} className="text-red-500 hover:underline text-xs">Удалить</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ))}

      {showModal && (
        <Modal isOpen onClose={() => setShowModal(false)} title={form.id ? "Изменить пункт" : "Новый пункт"}>
          <div className="space-y-3">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Профиль</span>
              <select
                value={form.age_profile}
                onChange={(e) => setForm({ ...form, age_profile: e.target.value as FormState["age_profile"] })}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200"
              >
                <option value="default">default (если профиль не выбран)</option>
                <option value="6-9">6-9 лет</option>
                <option value="10-13">10-13 лет</option>
                <option value="14-17">14-17 лет</option>
              </select>
            </label>
            <Field label="Заголовок (RU)" value={form.label_ru} onChange={(v) => setForm({ ...form, label_ru: v })} />
            <Field label="Заголовок (KK)" value={form.label_kk} onChange={(v) => setForm({ ...form, label_kk: v })} />
            <Field label="Href (с /:locale)" value={form.href} onChange={(v) => setForm({ ...form, href: v })} mono />
            <Field label="Иконка (emoji или slug)" value={form.icon} onChange={(v) => setForm({ ...form, icon: v })} />
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Сортировка</span>
              <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200" />
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.visible} onChange={(e) => setForm({ ...form, visible: e.target.checked })} />
              <span className="text-sm">Видим</span>
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

function Field({ label, value, onChange, mono }: { label: string; value: string; onChange: (v: string) => void; mono?: boolean }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 ${mono ? "font-mono text-sm" : ""}`}
      />
    </label>
  );
}
