"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  suggestions?: string[];
  className?: string;
}

export default function SearchBar({ placeholder = "Search...", onSearch, suggestions = [], className }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = suggestions.filter((s) =>
    s.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.parentElement?.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
    setShowSuggestions(false);
  };

  return (
    <form onSubmit={handleSubmit} className={cn("relative w-full", className)}>
      <div
        className="relative flex items-center rounded-full transition-all"
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        <svg
          className="absolute left-5 w-5 h-5"
          style={{ color: "var(--foreground-muted)" }}
          fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          className="w-full pl-14 pr-32 py-4 rounded-full bg-transparent text-foreground placeholder:text-[var(--foreground-muted)] placeholder:opacity-70 outline-none text-base"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(""); onSearch(""); }}
            className="absolute right-[100px] p-1 rounded-full hover:bg-[var(--muted)] transition-colors"
            aria-label="Clear"
          >
            <svg className="w-4 h-4" style={{ color: "var(--foreground-muted)" }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        <button
          type="submit"
          className="absolute right-2 px-5 py-2.5 rounded-full font-semibold text-sm text-white transition-colors hover:bg-[var(--primary-dark)]"
          style={{ backgroundColor: "var(--primary)" }}
        >
          {placeholder?.includes("айы") || placeholder?.includes("Іздеу") ? "Іздеу" : "Искать"}
        </button>
      </div>

      {showSuggestions && query && filtered.length > 0 && (
        <div
          className="absolute z-20 w-full mt-2 rounded-2xl overflow-hidden"
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          {filtered.slice(0, 8).map((suggestion, i) => (
            <button
              key={i}
              type="button"
              className="w-full px-5 py-3 text-left text-sm hover:bg-[var(--muted)] transition-colors border-b last:border-b-0"
              style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
              onClick={() => { setQuery(suggestion); onSearch(suggestion); setShowSuggestions(false); }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
