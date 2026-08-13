import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    metadataBase: new URL(origin),
    title: { default: "مِهام | يومك، مرتّب.", template: "%s | مِهام" },
    description: "مدير مهام عربي بسيط وهادئ يساعدك على ترتيب يومك وإنجاز ما يهمك.",
    openGraph: {
      title: "مِهام | يومك، مرتّب.",
      description: "قائمة مهام عربية هادئة، تحفظ تقدّمك وتبقي يومك واضحًا.",
      type: "website",
      locale: "ar_QA",
      images: [{ url: `${origin}/og.png`, width: 1731, height: 909, alt: "مِهام — يومك، مرتّب." }],
    },
    twitter: {
      card: "summary_large_image",
      title: "مِهام | يومك، مرتّب.",
      description: "قائمة مهام عربية هادئة تحفظ تقدّمك.",
      images: [`${origin}/og.png`],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
