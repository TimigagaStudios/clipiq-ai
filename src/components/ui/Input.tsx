import * as React from "react";
import { cn } from "../../utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border border-white/10 bg-[#100b1d] px-3 py-2 text-sm text-foreground shadow-[inset_4px_4px_10px_rgba(3,2,8,0.72),inset_-3px_-3px_9px_rgba(91,65,146,0.14),1px_1px_0_rgba(255,255,255,0.04)] ring-offset-background transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:border-brand/45 focus-visible:shadow-[inset_3px_3px_8px_rgba(3,2,8,0.6),inset_-2px_-2px_7px_rgba(124,92,255,0.2),0_0_0_3px_rgba(124,92,255,0.1)] disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";

export { Input };
