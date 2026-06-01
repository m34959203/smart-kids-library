"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    // Версия сборки в query → обновление SW при каждом деплое (ключ кеша меняется).
    const version = process.env.NEXT_PUBLIC_SW_VERSION ?? "0";

    // Когда НОВЫЙ SW берёт контроль над уже управляемой вкладкой (после деплоя) —
    // один раз перезагружаем, чтобы вытащить пользователя со старого бандла.
    // Если контроллера ещё не было (первый визит) — это не апдейт, не перезагружаем.
    const hadController = !!navigator.serviceWorker.controller;
    let reloaded = false;
    const onControllerChange = () => {
      if (reloaded || !hadController) return;
      reloaded = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    const onLoad = () => {
      navigator.serviceWorker.register(`/sw.js?v=${version}`).catch((e) => {
        console.warn("SW registration failed:", e);
      });
    };
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });
    return () => {
      window.removeEventListener("load", onLoad);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  return null;
}
