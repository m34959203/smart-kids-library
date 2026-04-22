"use client";

import { cn } from "@/lib/utils";
import { KidsIcon, TeensIcon, YouthIcon } from "@/components/icons/age-icons";
import type { AgeGroup } from "@/lib/utils";
import { useAgeProfile } from "@/lib/age-profile";

interface AgeProfileSwitcherProps {
  locale: string;
  onChange?: (group: AgeGroup | null) => void;
}

const profiles: Array<{
  group: AgeGroup;
  icon: React.ReactNode;
  labels: Record<string, string>;
}> = [
  {
    group: "6-9",
    icon: <KidsIcon className="w-4 h-4" />,
    labels: { ru: "6–9", kk: "6–9" },
  },
  {
    group: "10-13",
    icon: <TeensIcon className="w-4 h-4" />,
    labels: { ru: "10–13", kk: "10–13" },
  },
  {
    group: "14-17",
    icon: <YouthIcon className="w-4 h-4" />,
    labels: { ru: "14–17", kk: "14–17" },
  },
];

export default function AgeProfileSwitcher({ locale, onChange }: AgeProfileSwitcherProps) {
  const { ageGroup: active, setAgeGroup } = useAgeProfile();

  const handleSelect = (group: AgeGroup) => {
    const newGroup = active === group ? null : group;
    setAgeGroup(newGroup);
    onChange?.(newGroup);
  };

  return (
    <div
      className="hidden md:inline-flex items-center gap-0.5 p-0.5 rounded-full"
      style={{
        backgroundColor: "var(--muted)",
        border: "1px solid var(--border)",
      }}
    >
      {profiles.map((p) => {
        const isActive = active === p.group;
        return (
          <button
            key={p.group}
            onClick={() => handleSelect(p.group)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wider transition-all"
            )}
            style={{
              backgroundColor: isActive ? "var(--surface)" : "transparent",
              color: isActive ? "var(--primary)" : "var(--foreground-muted)",
              boxShadow: isActive ? "var(--shadow-sm)" : undefined,
            }}
            title={p.labels[locale] ?? p.labels.ru}
            aria-pressed={isActive}
          >
            {p.icon}
            <span>{p.labels[locale] ?? p.labels.ru}</span>
          </button>
        );
      })}
    </div>
  );
}
