"use client";

import { useState, useEffect, useCallback } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

interface Post {
  id: number;
  content_type: string;
  content_id: number;
  platform: "telegram" | "instagram";
  post_text: string;
  image_url: string | null;
  status: "pending" | "scheduled" | "posted" | "failed";
  scheduled_at: string | null;
  posted_at: string | null;
  error_message: string | null;
  created_at: string;
}

interface SocialSettings {
  social_telegram_token?: string;
  social_telegram_channel?: string;
  social_instagram_token?: string;
  social_instagram_account?: string;
  social_optimal_time_telegram?: string;
  social_optimal_time_instagram?: string;
  social_timezone_offset?: string;
}

export default function AdminSocialPage() {
  const [tab, setTab] = useState<"posts" | "settings">("posts");
  const [posts, setPosts] = useState<Post[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [settings, setSettings] = useState<SocialSettings>({});
  const [saving, setSaving] = useState(false);

  const reloadPosts = useCallback(async () => {
    const url = statusFilter ? `/api/admin/social/posts?status=${statusFilter}` : "/api/admin/social/posts";
    const r = await fetch(url);
    if (r.ok) setPosts((await r.json()).posts || []);
  }, [statusFilter]);

  const reloadSettings = useCallback(async () => {
    const r = await fetch("/api/admin/settings?group=social");
    if (r.ok) setSettings(((await r.json()).settings || {}) as SocialSettings);
  }, []);

  useEffect(() => { reloadPosts(); }, [reloadPosts]);
  useEffect(() => { reloadSettings(); }, [reloadSettings]);

  const action = async (id: number, act: "retry" | "cancel") => {
    await fetch("/api/admin/social/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: act }),
    });
    reloadPosts();
  };
  const remove = async (id: number) => {
    if (!confirm("Удалить пост из очереди?")) return;
    await fetch(`/api/admin/social/posts?id=${id}`, { method: "DELETE" });
    reloadPosts();
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (r.ok) await reloadSettings();
    } finally { setSaving(false); }
  };

  const statusColor: Record<Post["status"], string> = {
    posted: "bg-green-100 text-green-700",
    scheduled: "bg-yellow-100 text-yellow-700",
    pending: "bg-gray-100 text-gray-700",
    failed: "bg-red-100 text-red-700",
  };

  const stats = {
    total: posts.length,
    posted: posts.filter((p) => p.status === "posted").length,
    scheduled: posts.filter((p) => p.status === "scheduled").length,
    failed: posts.filter((p) => p.status === "failed").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-purple-900">Социальные сети</h1>
        <div className="flex gap-2">
          <button onClick={() => setTab("posts")} className={`px-4 py-2 rounded-xl text-sm ${tab === "posts" ? "bg-purple-500 text-white" : "bg-white text-purple-700 border border-purple-200"}`}>Очередь постов</button>
          <button onClick={() => setTab("settings")} className={`px-4 py-2 rounded-xl text-sm ${tab === "settings" ? "bg-purple-500 text-white" : "bg-white text-purple-700 border border-purple-200"}`}>Токены и настройки</button>
        </div>
      </div>

      {tab === "posts" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat label="Всего" value={stats.total} color="text-purple-700" />
            <Stat label="Опубликовано" value={stats.posted} color="text-green-600" />
            <Stat label="В очереди" value={stats.scheduled} color="text-yellow-600" />
            <Stat label="Ошибок" value={stats.failed} color="text-red-600" />
          </div>

          <div className="flex gap-2 items-center">
            <label className="text-sm text-gray-500">Фильтр:</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-purple-200 text-sm">
              <option value="">Все</option>
              <option value="scheduled">В очереди</option>
              <option value="posted">Опубликовано</option>
              <option value="failed">Ошибки</option>
              <option value="pending">Ожидает</option>
            </select>
          </div>

          <Card className="p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-purple-50 border-b border-purple-100">
                <tr className="text-left text-xs uppercase tracking-wider text-purple-700">
                  <th className="px-4 py-3">Платформа</th>
                  <th className="px-4 py-3">Тип</th>
                  <th className="px-4 py-3">Текст</th>
                  <th className="px-4 py-3">Запланирован</th>
                  <th className="px-4 py-3">Статус</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {posts.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">Пусто</td></tr>
                ) : posts.map((p) => (
                  <tr key={p.id} className="border-b border-gray-100 hover:bg-purple-50/30">
                    <td className="px-4 py-2">
                      {p.platform === "telegram" ? "📬 Telegram" : "📸 Instagram"}
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-500">{p.content_type}#{p.content_id}</td>
                    <td className="px-4 py-2 max-w-[340px] truncate text-xs">{p.post_text}</td>
                    <td className="px-4 py-2 text-xs">{p.scheduled_at ? new Date(p.scheduled_at).toLocaleString("ru-RU") : "—"}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${statusColor[p.status]}`}>{p.status}</span>
                      {p.error_message && <div className="text-xs text-red-500 mt-1">{p.error_message}</div>}
                    </td>
                    <td className="px-4 py-2 text-right space-x-2">
                      {(p.status === "failed" || p.status === "posted") && (
                        <button onClick={() => action(p.id, "retry")} className="text-purple-600 hover:underline text-xs">Retry</button>
                      )}
                      {(p.status === "scheduled" || p.status === "pending") && (
                        <button onClick={() => action(p.id, "cancel")} className="text-amber-600 hover:underline text-xs">Отменить</button>
                      )}
                      <button onClick={() => remove(p.id)} className="text-red-500 hover:underline text-xs">Удалить</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}

      {tab === "settings" && (
        <Card className="p-6 space-y-4">
          <h3 className="font-bold text-purple-900">Telegram</h3>
          <Field label="Bot Token" value={settings.social_telegram_token ?? ""} onChange={(v) => setSettings({ ...settings, social_telegram_token: v })} secret />
          <Field label="Channel ID или @username" value={settings.social_telegram_channel ?? ""} onChange={(v) => setSettings({ ...settings, social_telegram_channel: v })} />
          <Field label="Оптимальное время (HH:MM)" value={settings.social_optimal_time_telegram ?? ""} onChange={(v) => setSettings({ ...settings, social_optimal_time_telegram: v })} />

          <hr className="border-gray-100" />

          <h3 className="font-bold text-purple-900">Instagram</h3>
          <Field label="Access Token" value={settings.social_instagram_token ?? ""} onChange={(v) => setSettings({ ...settings, social_instagram_token: v })} secret />
          <Field label="Account ID" value={settings.social_instagram_account ?? ""} onChange={(v) => setSettings({ ...settings, social_instagram_account: v })} />
          <Field label="Оптимальное время (HH:MM)" value={settings.social_optimal_time_instagram ?? ""} onChange={(v) => setSettings({ ...settings, social_optimal_time_instagram: v })} />

          <hr className="border-gray-100" />

          <Field label="TZ offset (например +05:00 для Алматы)" value={settings.social_timezone_offset ?? ""} onChange={(v) => setSettings({ ...settings, social_timezone_offset: v })} />

          <div className="flex justify-end">
            <Button onClick={saveSettings} loading={saving}>Сохранить</Button>
          </div>
          <p className="text-xs text-gray-400">Секретные поля не показываются после сохранения. Чтобы заменить — введите новое значение.</p>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card className="p-4 text-center">
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      <div className="text-xs uppercase tracking-wider text-gray-500 mt-1">{label}</div>
    </Card>
  );
}

function Field({ label, value, onChange, secret }: { label: string; value: string; onChange: (v: string) => void; secret?: boolean }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <input
        type={secret ? "password" : "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 font-mono text-sm"
      />
    </label>
  );
}
