import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Piscina Abedul · Invitaciones",
  description: "Gestión de invitados a la piscina de la Comunidad Abedul",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
