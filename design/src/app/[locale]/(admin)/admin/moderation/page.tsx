"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

interface ModerationItem {
  id: number;
  kind: string;
  ref_id: number | null;
  payload: Record<string, unknown>;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  review_note?: string | null;
}

export default function AdminModerationPage() {
  const params = useParams();
  const locale = (params?.locale as string) ?? "ru";
  const kk = locale === "kk";
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [status, setStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/moderation?status=${status}`);
    if (res.ok) {
      const data = await res.json();
      setItems(data.items ?? []);
    }
    setLoading(false);
  }, [status]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const act = async (id: number, action: "approve" | "reject") => {
    setBusy(id);
    await fetch("/api/admin/moderation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    setBusy(null);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-purple-900">{kk ? "Модерация" : "Модерация"}</h1>
        <div className="flex gap-1">
          {(["pending", "approved", "rejected"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1 rounded-xl text-sm ${
                status === s ? "bg-purple-600 text-white" : "bg-purple-50 text-purple-700"
              }`}
            >
              {s === "pending" && (kk ? "Күтуде" : "На проверке")}
              {s === "approved" && (kk ? "Мақұлданды" : "Одобрено")}
              {s === "rejected" && (kk ? "Қабылданбады" : "Отклонено")}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="text-gray-400">{kk ? "Жүктелуде…" : "Загрузка…"}</p>}

      {!loading && items.length === 0 && (
        <Card className="p-8 text-center text-gray-400">
          {kk ? "Элементтер жоқ" : "Нет элементов"}
        </Card>
      )}

      <div className="space-y-3">
        {items.map((item) => {
          const payload = item.payload as Record<string, unknown>;
          const preview = String(payload.preview ?? payload.title ?? payload.content ?? JSON.stringify(payload).slice(0, 240));
          return (
            <Card key={item.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge variant="info">{item.kind}</Badge>
                    <Badge variant={item.status === "approved" ? "success" : item.status === "rejected" ? "danger" : "warning"}>
                      {item.status}
                    </Badge>
                    <span className="text-xs text-gray-400">{new Date(item.created_at).toLocaleString(kk ? "kk-KZ" : "ru-RU")}</span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{preview}</p>
                  {item.review_note && (
                    <p className="mt-2 text-xs text-gray-500 italic">Note: {item.review_note}</p>
                  )}
                </div>
                {item.status === "pending" && (
                  <div className="flex gap-1 shrink-0">
                    <Button variant="primary" size="sm" disabled={busy === item.id} onClick={() => act(item.id, "approve")}>
                      {kk ? "Мақұлдау" : "Одобрить"}
                    </Button>
                    <Button variant="danger" size="sm" disabled={busy === item.id} onClick={() => act(item.id, "reject")}>
                      {kk ? "Қабылдамау" : "Отклонить"}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
