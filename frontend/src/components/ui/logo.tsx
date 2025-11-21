import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "default" | "compact";
  className?: string;
}

export function Logo({ variant = "default", className }: LogoProps) {
  return (
    <Link
      to="/"
      className={cn("flex items-center gap-3 group", className)}
      aria-label="Matcha home"
    >
      {/* Text - shown on desktop or when variant is default */}
      {variant === "default" && (
        <span className="text-4xl logo-gradient select-none leading-none">Matcha</span>
      )}
    </Link>
  );
}
