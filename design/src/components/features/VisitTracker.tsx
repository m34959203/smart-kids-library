"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAgeProfile } from "@/lib/age-profile";

function getSessionId(): string {
  try {
    let sid = sessionStorage.getItem("skl.sid");
    if (!sid) {
      sid = crypto.randomUUID?.() ?? `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem("skl.sid", sid);
    }
    return sid;
  } catch {
    return "anon";
  }
}

export default function VisitTracker({ locale }: { locale: string }) {
  const pathname = usePathname();
  const { ageGroup } = useAgeProfile();

  useEffect(() => {
    if (!pathname) return;
    const payload = {
      path: pathname,
      locale,
      ageGroup: ageGroup ?? undefined,
      referrer: typeof document !== "undefined" ? document.referrer : undefined,
      sessionId: getSessionId(),
    };
    fetch("/api/visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => undefined);
  }, [pathname, locale, ageGroup]);

  return null;
}
