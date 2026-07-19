import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  HTMLAttributes,
  PropsWithChildren,
} from "react";

type Intent = "primary" | "secondary" | "brand" | "lime" | "danger";

function classes(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function BrandButton({
  intent = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { intent?: Intent }) {
  return (
    <button
      className={classes("rc-button", `rc-button--${intent}`, className)}
      {...props}
    />
  );
}

export function BrandLink({
  intent = "primary",
  className,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { intent?: Intent }) {
  return (
    <a
      className={classes("rc-button", `rc-button--${intent}`, className)}
      {...props}
    />
  );
}

export function BrandBadge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "brand" | "lime";
}) {
  return (
    <span
      className={classes("rc-badge", `rc-badge--${tone}`, className)}
      {...props}
    />
  );
}

export function BrandSurface({
  tone = "raised",
  className,
  ...props
}: PropsWithChildren<
  HTMLAttributes<HTMLElement> & {
    tone?: "raised" | "brand" | "ink";
  }
>) {
  return (
    <section
      className={classes("rc-surface", `rc-surface--${tone}`, className)}
      {...props}
    />
  );
}

export function BrandKicker({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={classes("rc-kicker", className)} {...props} />;
}

export function RizzMeter({
  value,
  label,
  className,
}: {
  value: number;
  label: string;
  className?: string;
}) {
  const bounded = Math.min(100, Math.max(0, value));

  return (
    <div
      className={classes("rc-meter", className)}
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={bounded}
    >
      <span className="rc-meter__track" aria-hidden="true">
        <span className="rc-meter__fill" style={{ width: `${bounded}%` }} />
        <span className="rc-meter__thumb" style={{ left: `${bounded}%` }} />
      </span>
    </div>
  );
}
