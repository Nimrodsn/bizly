"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";

type Result = { type: string; id: string; name: string };

const hrefFor: Record<string, string> = {
  client: "/clients",
  supplier: "/suppliers",
  activity: "/settings/activities",
};

export function CommandSearch() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    const handle = setTimeout(() => {
      void fetch(`/api/search?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((json: { results?: Result[] }) => setResults(json.results ?? []));
    }, 250);
    return () => clearTimeout(handle);
  }, [q]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
        document.getElementById("global-search")?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="relative hidden min-w-56 flex-1 md:block">
      <Input
        id="global-search"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="חיפוש (Ctrl+K)"
        aria-label="חיפוש"
      />
      {open && results.length > 0 ? (
        <ul className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-950">
          {results.map((r) => (
            <li key={`${r.type}-${r.id}`}>
              <Link
                href={hrefFor[r.type] ?? "/transactions"}
                className="block rounded px-2 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-900"
                onClick={() => setOpen(false)}
              >
                <span className="text-xs text-slate-400">{r.type}</span> {r.name}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
