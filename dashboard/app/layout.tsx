import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Astro Dashboard",
  description: "Dashboard du bot Discord Astro"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
