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
  color: string;
  bgColor: string;
  labels: Record<string, string>;
}> = [
  {
    group: "6-9",
    icon: <KidsIcon className="w-5 h-5" />,
    color: "text-orange-500",
    bgColor: "bg-orange-100 hover:bg-orange-200 border-orange-300",
    labels: { ru: "6-9 лет", kk: "6-9 жас" },
  },
  {
    group: "10-13",
    icon: <TeensIcon className="w-5 h-5" />,
    color: "text-blue-500",
    bgColor: "bg-blue-100 hover:bg-blue-200 border-blue-300",
    labels: { ru: "10-13 лет", kk: "10-13 жас" },
  },
  {
    group: "14-17",
    icon: <YouthIcon className="w-5 h-5" />,
    color: "text-purple-500",
    bgColor: "bg-purple-100 hover:bg-purple-200 border-purple-300",
    labels: { ru: "14-17 лет", kk: "14-17 жас" },
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
    <div className="flex gap-1">
      {profiles.map((p) => (
        <button
          key={p.group}
          onClick={() => handleSelect(p.group)}
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-medium transition-all border",
            active === p.group
              ? `${p.bgColor} ${p.color} border-2 shadow-sm`
              : "bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100"
          )}
          title={p.labels[locale] ?? p.labels.ru}
        >
          {p.icon}
          <span className="hidden sm:inline">{p.labels[locale] ?? p.labels.ru}</span>
        </button>
      ))}
    </div>
  );
}
