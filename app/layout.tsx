import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Startup Manager",
  description:
    "Startup management system for products, inventory, sales, training and payments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}