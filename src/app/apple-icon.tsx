import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#2f6353",
          color: "#faf5ea",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 100,
          fontWeight: 700,
          letterSpacing: "-4px",
          borderRadius: "20%",
        }}
      >
        skl
      </div>
    ),
    size,
  );
}
