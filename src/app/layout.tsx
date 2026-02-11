import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Online PT",
  description: "Personal Training Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body suppressHydrationWarning>
        <div className="mobile-wrapper">
          <Providers>
            {children}
          </Providers>
        </div>
      </body>
    </html>
  );
}
