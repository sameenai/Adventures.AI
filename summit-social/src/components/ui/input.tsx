import { cn } from "@/lib/utils";
import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-display uppercase tracking-widest text-stone-400"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            "block w-full border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-stone-100",
            "placeholder:text-stone-600",
            "focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30",
            "disabled:bg-stone-800 disabled:text-stone-500",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/30",
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
