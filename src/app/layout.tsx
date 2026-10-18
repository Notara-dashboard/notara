import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
export const metadata: Metadata = {
  title: "Notara · Your world. Organised.",
  description: "Your private property and executive workspace.",
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-ZA" suppressHydrationWarning>
      <body className={GeistSans.className}>
        <a href="#main-content" className="skip-link">
          Skip to workspace
        </a>
        {children}
      </body>
    </html>
  );
}
