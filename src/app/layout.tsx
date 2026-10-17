import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { Workspace } from "@/components/workspace";
export const metadata: Metadata = {
  title: "Notara · Your world. Organised.",
  description:
    "Your day. Your properties. Your intelligence. Notara visual foundation preview with labelled sample data.",
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
        <Workspace>{children}</Workspace>
      </body>
    </html>
  );
}
