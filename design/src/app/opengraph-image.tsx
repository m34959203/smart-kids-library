import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Smart Kids Library Satpayev";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #fbbf24 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontFamily: "sans-serif",
          padding: 80,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 96, fontWeight: 900, marginBottom: 24 }}>📚 Smart Kids Library</div>
        <div style={{ fontSize: 48, fontWeight: 700 }}>г. Сатпаев · Сәтбаев қ.</div>
        <div style={{ fontSize: 32, marginTop: 40, opacity: 0.9 }}>
          Каталог · ИИ-консультант · Сказки · События
        </div>
      </div>
    ),
    size
  );
}
