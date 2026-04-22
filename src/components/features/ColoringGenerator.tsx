"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

interface ColoringGeneratorProps {
  locale: string;
}

export default function ColoringGenerator({ locale }: ColoringGeneratorProps) {
  const [theme, setTheme] = useState("");
  const [loading, setLoading] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [svgs, setSvgs] = useState<string[]>([]);

  const labels = locale === "kk"
    ? {
        title: "Бояулар генераторы",
        placeholder: "Тақырыпты теріңіз (мысалы: арыстан, құс)",
        generate: "5 бояу жасау!",
        generating: "Жасалуда...",
        downloadPdf: "PDF жүктеу",
        downloadOne: "SVG жүктеу",
        pdfBusy: "PDF жасалуда...",
      }
    : {
        title: "Генератор раскрасок",
        placeholder: "Введите тему (например: лев, птица)",
        generate: "Создать 5 раскрасок!",
        generating: "Создаю...",
        downloadPdf: "Скачать PDF",
        downloadOne: "Скачать SVG",
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

  const generateColorings = async () => {
    if (!theme.trim()) return;
    setLoading(true);
    setSvgs([]);
    try {
      // 5 раскрасок параллельно (ТЗ: «5 контурных иллюстраций → PDF»)
      const variants = ["main", "side", "scene", "close-up", "playful"];
      const results = await Promise.allSettled(
        variants.map((variant) =>
          fetch("/api/coloring", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ theme: `${theme} (${variant})`, language: locale }),
          }).then((r) => r.json()),
        ),
      );
      const out = results
        .filter((r): r is PromiseFulfilledResult<{ svg?: string }> => r.status === "fulfilled" && Boolean(r.value?.svg))
        .map((r) => r.value.svg as string);
      setSvgs(out);
    } finally {
      setLoading(false);
    }
  };

  const svgToPngDataUrl = (svg: string, width = 800): Promise<string> => {
    return new Promise((resolve, reject) => {
      const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ratio = img.height / img.width || 1;
        canvas.width = width;
        canvas.height = Math.round(width * ratio);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error("no ctx"));
          return;
        }
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("img load"));
      };
      img.src = url;
    });
  };

  const downloadPdf = async () => {
    if (svgs.length === 0) return;
    setPdfBusy(true);
    try {
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < svgs.length; i++) {
        if (i > 0) pdf.addPage();
        try {
          const png = await svgToPngDataUrl(svgs[i], 1200);
          // вписать в страницу с полями 10мм
          const margin = 10;
          const w = pageW - margin * 2;
          const h = pageH - margin * 2 - 15;
          pdf.addImage(png, "PNG", margin, margin + 10, w, h, undefined, "FAST");
          pdf.setFontSize(12);
          pdf.text(`${theme} — ${i + 1}/${svgs.length}`, pageW / 2, margin + 5, { align: "center" });
        } catch {
          pdf.setFontSize(14);
          pdf.text(`Изображение ${i + 1} не удалось встроить`, pageW / 2, pageH / 2, { align: "center" });
        }
      }
      pdf.save(`coloring-${theme.replace(/\s+/g, "-")}.pdf`);
    } finally {
      setPdfBusy(false);
    }
  };

  const downloadOneSvg = (svg: string, idx: number) => {
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `coloring-${theme}-${idx + 1}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
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
        <Button onClick={generateColorings} loading={loading} size="lg">
          {loading ? labels.generating : labels.generate}
        </Button>
      </div>

      {svgs.length > 0 && (
        <>
          <div className="flex justify-center">
            <Button onClick={downloadPdf} loading={pdfBusy} size="lg">
              {pdfBusy ? labels.pdfBusy : `📄 ${labels.downloadPdf} (${svgs.length})`}
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {svgs.map((svg, i) => (
              <Card key={i} className="p-4 text-center">
                <div
                  className="inline-block max-w-full"
                  dangerouslySetInnerHTML={{ __html: svg }}
                />
                <div className="mt-3">
                  <Button variant="outline" size="sm" onClick={() => downloadOneSvg(svg, i)}>
                    {labels.downloadOne}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
