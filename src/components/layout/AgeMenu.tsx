"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AGE_MENU, useAgeProfile } from "@/lib/age-profile";

interface AgeMenuProps {
  locale: string;
  /**
   * Fallback links shown when no age profile is selected.
   */
  fallback: Array<{ href: string; label: string }>;
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
}

export default function AgeMenu({ locale, fallback, variant = "desktop", onNavigate }: AgeMenuProps) {
  const { ageGroup, hydrated } = useAgeProfile();
  const pathname = usePathname() ?? "";

  if (!hydrated || !ageGroup) {
    return variant === "desktop" ? (
      <>
        {fallback.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="px-3 py-2 rounded-xl text-sm font-medium text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-all"
          >
            {link.label}
          </Link>
        ))}
      </>
    ) : (
      <>
        {fallback.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className="block px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-all"
          >
            {link.label}
          </Link>
        ))}
      </>
    );
  }

  const menu = AGE_MENU[ageGroup];

  return variant === "desktop" ? (
    <>
      {menu.map((item) => {
        const href = item.href(locale);
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={item.key}
            href={href}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
              active
                ? "bg-purple-100 text-purple-700"
                : "text-gray-600 hover:text-purple-600 hover:bg-purple-50"
            }`}
          >
            {item.label[locale] ?? item.label.ru}
          </Link>
        );
      })}
    </>
  ) : (
    <>
      {menu.map((item) => {
        const href = item.href(locale);
        return (
          <Link
            key={item.key}
            href={href}
            onClick={onNavigate}
            className="block px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-all"
          >
            {item.label[locale] ?? item.label.ru}
          </Link>
        );
      })}
    </>
  );
}
