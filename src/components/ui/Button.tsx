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
      // Soft UI keeps the ClipIQ violet/fuchsia palette but gives controls a
      // tactile raised surface: a subtle top-left highlight + soft outer depth.
      default:
        "border border-white/10 bg-gradient-to-br from-[#8b70ff] to-[#6b4ce7] text-brand-foreground shadow-[8px_8px_18px_rgba(3,2,8,0.78),-5px_-5px_16px_rgba(105,76,175,0.2),inset_1px_1px_0_rgba(255,255,255,0.24)] hover:brightness-110 hover:shadow-[10px_10px_22px_rgba(3,2,8,0.82),-5px_-5px_18px_rgba(124,92,255,0.3),inset_1px_1px_0_rgba(255,255,255,0.28)] active:shadow-[inset_5px_5px_12px_rgba(42,24,103,0.52),inset_-3px_-3px_10px_rgba(177,156,255,0.2)]",
      gradient:
        "border border-white/10 bg-gradient-to-r from-brand via-[#a85cf5] to-brand-2 text-white shadow-[8px_8px_20px_rgba(3,2,8,0.78),-5px_-5px_16px_rgba(126,77,196,0.22),inset_1px_1px_0_rgba(255,255,255,0.24)] hover:brightness-110 hover:shadow-[10px_10px_24px_rgba(3,2,8,0.82),-5px_-5px_18px_rgba(255,77,141,0.2),inset_1px_1px_0_rgba(255,255,255,0.28)] active:shadow-[inset_5px_5px_12px_rgba(82,28,116,0.45),inset_-3px_-3px_10px_rgba(255,181,218,0.18)]",
      glass:
        "border border-white/10 bg-[#120d20] text-foreground shadow-[7px_7px_16px_rgba(3,2,8,0.72),-4px_-4px_13px_rgba(89,65,142,0.17),inset_1px_1px_0_rgba(255,255,255,0.11)] hover:border-brand/35 hover:text-white hover:bg-[#18102a] active:shadow-[inset_4px_4px_10px_rgba(3,2,8,0.7),inset_-3px_-3px_8px_rgba(99,72,156,0.16)]",
      neon:
        "border border-brand/55 bg-[#17102a] text-white shadow-[0_0_20px_-7px_rgba(124,92,255,0.8),7px_7px_16px_rgba(3,2,8,0.7),inset_1px_1px_0_rgba(255,255,255,0.13)] hover:border-brand-2/70 hover:shadow-[0_0_26px_-5px_rgba(255,77,141,0.82),8px_8px_18px_rgba(3,2,8,0.75),inset_1px_1px_0_rgba(255,255,255,0.16)]",
      destructive:
        "border border-red-300/15 bg-[#401420] text-destructive-foreground shadow-[7px_7px_16px_rgba(3,2,8,0.72),-4px_-4px_12px_rgba(135,42,64,0.16),inset_1px_1px_0_rgba(255,255,255,0.11)] hover:bg-[#591a2a] active:shadow-[inset_4px_4px_10px_rgba(42,5,13,0.65),inset_-3px_-3px_8px_rgba(151,52,76,0.15)]",
      outline:
        "border border-white/12 bg-[#120d20] text-foreground shadow-[7px_7px_16px_rgba(3,2,8,0.72),-4px_-4px_13px_rgba(89,65,142,0.17),inset_1px_1px_0_rgba(255,255,255,0.11)] hover:border-brand/40 hover:bg-[#18102a] hover:text-white active:shadow-[inset_4px_4px_10px_rgba(3,2,8,0.7),inset_-3px_-3px_8px_rgba(99,72,156,0.16)]",
      secondary:
        "border border-white/10 bg-[#171126] text-foreground shadow-[6px_6px_14px_rgba(3,2,8,0.7),-4px_-4px_12px_rgba(89,65,142,0.15),inset_1px_1px_0_rgba(255,255,255,0.1)] hover:bg-[#1d1530] active:shadow-[inset_4px_4px_10px_rgba(3,2,8,0.65),inset_-3px_-3px_8px_rgba(99,72,156,0.14)]",
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
