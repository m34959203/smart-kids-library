"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

interface ColoringGeneratorProps {
  locale: string;
}

interface ColoringResult {
  image?: string; // data:image/png;base64,...  (Imagen — высокое качество)
  svg?: string;   // fallback line-art
}

export default function ColoringGenerator({ locale }: ColoringGeneratorProps) {
  const [theme, setTheme] = useState("");
  const [loading, setLoading] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [result, setResult] = useState<ColoringResult | null>(null);
  const [rateLimit, setRateLimit] = useState<{ message: string; hint?: string } | null>(null);

  const labels = locale === "kk"
    ? {
        title: "Бояулар генераторы",
        placeholder: "Тақырыпты теріңіз (мысалы: арыстан, құс)",
        generate: "Бояу жасау!",
        generating: "Жасалуда...",
        downloadPdf: "PDF жүктеу",
        downloadImg: "Сурет жүктеу",
        pdfBusy: "PDF жасалуда...",
      }
    : {
        title: "Генератор раскрасок",
        placeholder: "Введите тему (например: лев, птица)",
        generate: "Создать раскраску!",
        generating: "Создаю...",
        downloadPdf: "Скачать PDF",
        downloadImg: "Скачать картинку",
        pdfBusy: "Готовлю PDF...",
      };

  const themes = [
    { icon: "🦁", label: locale === "kk" ? "Арыстан" : "Лев" },
    { icon: "🦋", label: locale === "kk" ? "Көбелек" : "Бабочка" },
    { icon: "🏰", label: locale === "kk" ? "Сарай" : "Замок" },
    { icon: "🚀", label: locale === "kk" ? "Зымыран" : "Ракета" },
    { icon: "🌸", label: locale === "kk" ? "Гүл" : "Цветок" },
    { icon: "🐱", label: locale === "kk" ? "Мысық" : "Кошка" },
  ];

  const generateColoring = async () => {
    if (!theme.trim()) return;
    setLoading(true);
    setResult(null);
    setRateLimit(null);
    try {
      const r = await fetch("/api/coloring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme, language: locale }),
      });
      const body = await r.json();
      if (r.status === 429 && body?.source === "rate_limit") {
        setRateLimit({ message: body.error, hint: body.hint });
        return;
      }
      if (body?.image) setResult({ image: body.image });
      else if (body?.svg) setResult({ svg: body.svg });
    } finally {
      setLoading(false);
    }
  };

  const svgToPngDataUrl = (svg: string, width = 1200): Promise<string> =>
    new Promise((resolve, reject) => {
      const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ratio = img.height / img.width || 1;
        canvas.width = width;
        canvas.height = Math.round(width * ratio);
        const ctx = canvas.getContext("2d");
        if (!ctx) { URL.revokeObjectURL(url); reject(new Error("no ctx")); return; }
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("img load")); };
      img.src = url;
    });

  const downloadPdf = async () => {
    if (!result) return;
    setPdfBusy(true);
    try {
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const png = result.image ?? (result.svg ? await svgToPngDataUrl(result.svg, 1200) : null);
      if (png) {
        pdf.setFontSize(12);
        pdf.text(theme, pageW / 2, margin + 5, { align: "center" });
        pdf.addImage(png, "PNG", margin, margin + 10, pageW - margin * 2, pageH - margin * 2 - 15, undefined, "FAST");
      }
      pdf.save(`coloring-${theme.replace(/\s+/g, "-")}.pdf`);
    } finally {
      setPdfBusy(false);
    }
  };

  const downloadImage = async () => {
    if (!result) return;
    const dataUrl = result.image ?? (result.svg ? await svgToPngDataUrl(result.svg, 1200) : null);
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `coloring-${theme.replace(/\s+/g, "-")}.png`;
    a.click();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-purple-900 text-center">{labels.title}</h2>

      <div className="flex flex-wrap gap-2 justify-center">
        {themes.map((t) => (
          <button
            key={t.label}
            onClick={() => setTheme(t.label)}
            className={`px-4 py-3 rounded-2xl text-lg transition-all ${
              theme === t.label ? "bg-purple-500 text-white shadow-md" : "bg-white shadow-sm hover:shadow-md"
            }`}
          >
            <span className="mr-1">{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          placeholder={labels.placeholder}
          className="flex-1 px-4 py-3 rounded-2xl border-2 border-purple-200 focus:border-purple-500 outline-none"
        />
        <Button onClick={generateColoring} loading={loading} size="lg">
          {loading ? labels.generating : labels.generate}
        </Button>
      </div>

      {rateLimit && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <div className="font-semibold">{rateLimit.message}</div>
          {rateLimit.hint && <div className="mt-1 text-amber-800/80">{rateLimit.hint}</div>}
        </div>
      )}

      {result && (
        <Card className="p-4 text-center space-y-4">
          {result.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={result.image} alt={theme} className="w-full max-w-md mx-auto rounded-xl bg-white" />
          ) : (
            <div
              data-coloring
              className="w-full max-w-md mx-auto"
              style={{ aspectRatio: "1 / 1" }}
              dangerouslySetInnerHTML={{ __html: result.svg ?? "" }}
            />
          )}
          <div className="flex gap-2 justify-center">
            <Button onClick={downloadPdf} loading={pdfBusy} size="lg">
              {pdfBusy ? labels.pdfBusy : `📄 ${labels.downloadPdf}`}
            </Button>
            <Button variant="outline" size="lg" onClick={downloadImage}>
              {labels.downloadImg}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
