import * as React from "react";
import { cn } from "../../utils/cn";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "gradient"
    | "glass"
    | "neon"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
      // Everyday primary: solid brand violet + soft glow (themed, not white).
      default:
        "bg-brand text-brand-foreground shadow-[0_10px_30px_-10px_rgba(124,92,255,0.8)] hover:bg-brand/90",
      // Hero CTA: violet->fuchsia gradient + neon-ish glow.
      gradient:
        "bg-gradient-to-r from-brand to-brand-2 text-white shadow-[0_10px_34px_-10px_rgba(255,77,141,0.7)] hover:opacity-95",
      // Frosted glass (the "Frosted UI" look) for secondary / nav / search.
      glass:
        "border border-white/15 bg-white/5 text-foreground backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] hover:bg-white/10 hover:border-brand/40",
      // Neon glow outline (recolored to brand) for emphasis on black.
      neon:
        "border border-brand/60 bg-brand/10 text-white shadow-[0_0_24px_-4px_rgba(124,92,255,0.75)] hover:shadow-[0_0_30px_-2px_rgba(255,77,141,0.75)] hover:bg-brand/20",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      outline:
        "border border-white/15 bg-white/5 text-foreground backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] hover:bg-white/10 hover:border-brand/40",
      secondary:
        "bg-white/5 text-foreground border border-white/10 backdrop-blur-md hover:bg-white/10",
      ghost: "text-foreground hover:bg-white/5 hover:text-white",
      link: "text-brand underline-offset-4 hover:underline",
    };

    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      lg: "h-11 rounded-md px-8",
      icon: "h-10 w-10",
    };

    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-xl text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
          variants[variant],
          sizes[size],
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

export { Button };
