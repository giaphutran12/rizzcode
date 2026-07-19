import type { Metadata } from "next";
import type { PropsWithChildren } from "react";
import "../design-system/tokens.css";
import "../design-system/components.css";
import "../styles/global.css";

export const metadata: Metadata = {
  title: "RizzCode",
  description: "Grounded social-fluency practice with adaptive conversations.",
  icons: {
    icon: "/brand/rizzcode-mark.png",
    apple: "/brand/rizzcode-mark.png",
  },
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
