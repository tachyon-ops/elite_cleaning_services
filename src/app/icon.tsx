import { ImageResponse } from "next/og";

// Route segment config
export const runtime = "edge";

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 16,
          background: "#0f172a",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Georgia, serif",
          fontWeight: "bold",
          borderRadius: "6px",
          border: "1px solid rgba(212, 175, 55, 0.2)",
          color: "#ffffff",
        }}
      >
        M<span style={{ color: "#d4af37", marginLeft: "0.5px" }}>O</span>
      </div>
    ),
    {
      ...size,
    }
  );
}
