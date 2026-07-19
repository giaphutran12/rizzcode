import type { CSSProperties } from "react";

type BrandLogoProps = {
  variant?: "lockup" | "mark" | "meter";
  tone?: "default" | "inverse";
  className?: string;
  priority?: boolean;
  style?: CSSProperties;
};

const assets = {
  lockup: {
    default: "/brand/rizzcode-lockup.png",
    inverse: "/brand/rizzcode-lockup-inverse.png",
    width: 1200,
    height: 288,
  },
  mark: {
    default: "/brand/rizzcode-mark.png",
    inverse: "/brand/rizzcode-mark-inverse.png",
    width: 512,
    height: 526,
  },
  meter: {
    default: "/brand/rizzcode-meter-wordmark.png",
    inverse: "/brand/rizzcode-meter-wordmark.png",
    width: 1200,
    height: 379,
  },
} as const;

export function BrandLogo({
  variant = "lockup",
  tone = "default",
  className,
  priority = false,
  style,
}: BrandLogoProps) {
  const asset = assets[variant];

  return (
    <img
      className={className}
      src={asset[tone]}
      width={asset.width}
      height={asset.height}
      alt="RizzCode"
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      style={style}
    />
  );
}
