import { cn } from "@/lib/utils";

export function TapMenuLogo({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const sizes = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-4xl",
    xl: "text-5xl md:text-6xl",
  };
  return (
    <span
      className={cn(
        "font-[family-name:var(--font-display)] font-bold tracking-tight text-[var(--brand)]",
        sizes[size],
        className
      )}
    >
      Tap<span className="text-[var(--accent)]">Menu</span>
    </span>
  );
}
