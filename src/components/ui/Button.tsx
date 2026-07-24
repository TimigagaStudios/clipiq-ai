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
      /*
       * Dark-theme adaptation of the selected Soft UI reference:
       * a restrained, almost-solid surface; a fine upper highlight; and one
       * broad, low-contrast shadow below. This intentionally avoids a glossy
       * or neon treatment while retaining ClipIQ's violet brand identity.
       */
      default:
        "border border-white/14 bg-[#765bd0] text-white shadow-[0_11px_20px_rgba(4,2,10,0.64),0_4px_7px_rgba(49,31,105,0.42),inset_0_1px_1px_rgba(255,255,255,0.28),inset_0_-1px_1px_rgba(43,25,99,0.24)] hover:bg-[#8065dc] hover:shadow-[0_13px_24px_rgba(4,2,10,0.68),0_5px_8px_rgba(60,38,122,0.45),inset_0_1px_1px_rgba(255,255,255,0.3),inset_0_-1px_1px_rgba(43,25,99,0.22)] active:bg-[#694ebd] active:shadow-[inset_0_4px_8px_rgba(47,28,105,0.48),inset_0_-1px_1px_rgba(255,255,255,0.13)]",
      // Kept for intentional hero-gradient use elsewhere; default is the Soft UI primary.
      gradient:
        "border border-white/14 bg-gradient-to-r from-[#765bd0] to-[#b75bc9] text-white shadow-[0_11px_20px_rgba(4,2,10,0.64),0_4px_7px_rgba(92,41,122,0.35),inset_0_1px_1px_rgba(255,255,255,0.25),inset_0_-1px_1px_rgba(59,29,105,0.2)] hover:brightness-105 active:shadow-[inset_0_4px_8px_rgba(72,29,100,0.42),inset_0_-1px_1px_rgba(255,255,255,0.12)]",
      glass:
        "border border-white/10 bg-[#171126] text-foreground shadow-[0_9px_18px_rgba(4,2,10,0.58),0_3px_6px_rgba(80,58,135,0.22),inset_0_1px_1px_rgba(255,255,255,0.12),inset_0_-1px_1px_rgba(0,0,0,0.22)] hover:bg-[#1d1530] hover:text-white active:shadow-[inset_0_3px_7px_rgba(3,2,8,0.6),inset_0_-1px_1px_rgba(255,255,255,0.08)]",
      neon:
        "border border-brand/55 bg-[#171126] text-white shadow-[0_0_18px_-8px_rgba(124,92,255,0.9),0_9px_18px_rgba(4,2,10,0.58),inset_0_1px_1px_rgba(255,255,255,0.13)] hover:border-brand-2/70 hover:bg-[#211637]",
      destructive:
        "border border-red-300/15 bg-[#64243a] text-destructive-foreground shadow-[0_9px_18px_rgba(4,2,10,0.58),0_3px_6px_rgba(125,39,65,0.3),inset_0_1px_1px_rgba(255,255,255,0.16),inset_0_-1px_1px_rgba(58,11,24,0.25)] hover:bg-[#743047] active:shadow-[inset_0_3px_7px_rgba(52,7,19,0.6)]",
      outline:
        "border border-white/12 bg-[#171126] text-foreground shadow-[0_9px_18px_rgba(4,2,10,0.58),0_3px_6px_rgba(80,58,135,0.22),inset_0_1px_1px_rgba(255,255,255,0.12),inset_0_-1px_1px_rgba(0,0,0,0.22)] hover:border-brand/40 hover:bg-[#1d1530] hover:text-white active:shadow-[inset_0_3px_7px_rgba(3,2,8,0.6),inset_0_-1px_1px_rgba(255,255,255,0.08)]",
      secondary:
        "border border-white/10 bg-[#211938] text-foreground shadow-[0_8px_16px_rgba(4,2,10,0.55),0_3px_5px_rgba(87,62,145,0.2),inset_0_1px_1px_rgba(255,255,255,0.1)] hover:bg-[#2a2046] active:shadow-[inset_0_3px_7px_rgba(3,2,8,0.55)]",
      ghost: "text-foreground hover:bg-white/5 hover:text-white",
      link: "text-brand underline-offset-4 hover:text-brand-2 hover:underline",
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
          "inline-flex items-center justify-center rounded-xl text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:translate-y-px active:scale-[0.99]",
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
