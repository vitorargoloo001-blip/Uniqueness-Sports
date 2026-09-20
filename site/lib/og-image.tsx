import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const OG_SIZE = { width: 1200, height: 630 };

let logoDataUrl: string | null = null;
async function getLogoDataUrl(): Promise<string> {
  if (logoDataUrl) return logoDataUrl;
  const buffer = await readFile(join(process.cwd(), "public/identidade/logo.png"));
  logoDataUrl = `data:image/png;base64,${buffer.toString("base64")}`;
  return logoDataUrl;
}

export async function renderOgImage(subtitle?: string) {
  const logoSrc = await getLogoDataUrl();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          padding: 80,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} alt="" width={420} height={126} style={{ objectFit: "contain" }} />
        {subtitle && (
          <div
            style={{
              marginTop: 36,
              fontSize: 32,
              color: "#999590",
              letterSpacing: 4,
              textTransform: "uppercase",
              textAlign: "center",
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
    ),
    { ...OG_SIZE },
  );
}
