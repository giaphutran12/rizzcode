import type { Metadata } from "next";
import type { PropsWithChildren } from "react";
import "../styles/global.css";

export const metadata: Metadata = {
  title: "RizzCode",
  description: "Grounded social-fluency practice with adaptive conversations.",
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
