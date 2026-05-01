import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 uppercase tracking-wide",
  {
    variants: {
      variant: {
        default: "bg-white text-black border-slate-200 border-2 border-b-4 active:border-b-2 hover:bg-slate-100 text-slate-500",
        primary: "bg-[#58cc02] text-white hover:bg-[#4aad02]/90 border-[#4aad02] border-b-4 active:border-b-0",
        primaryOutline: "bg-white text-[#58cc02] hover:bg-slate-100 border-2 border-[#58cc02]",
        secondary: "bg-[#1cb0f6] text-primary-foreground hover:bg-[#1cb0f6]/90 border-[#1899d6] border-b-4 active:border-b-0",
        secondaryOutline: "bg-white text-[#1cb0f6] hover:bg-slate-100",
        danger: "bg-[#ff4b4b] text-white hover:bg-[#ff4b4b]/90 border-[#e04444] border-b-4 active:border-b-0",
        dangerOutline: "bg-white text-[#ff4b4b] hover:bg-slate-100",
        warning: "bg-[#ffc800] text-black hover:bg-[#ffc800]/90 border-[#e0b000] border-b-4 active:border-b-0",
        ghost: "bg-transparent text-slate-500 border-transparent border-0 hover:bg-slate-100",
        sidebar: "bg-transparent text-slate-500 border-2 border-transparent hover:bg-slate-100 transition-none",
        sidebarActive: "bg-[#58cc02]/15 text-[#58cc02] border-[#58cc02] border-2 hover:bg-[#58cc02]/20 transition-none",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-12 px-8",
        xl: "h-14 px-10 text-base",
        icon: "h-10 w-10",
        rounded: "rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
