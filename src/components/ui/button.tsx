import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-neon-cyan text-deep-space hover:bg-neon-blue hover:shadow-glow-cyan font-semibold transition-all duration-300",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border-2 border-neon-cyan bg-transparent text-neon-cyan hover:bg-neon-cyan/10 hover:shadow-glow-cyan transition-all duration-300",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-muted hover:text-foreground transition-colors",
        link: "text-neon-cyan underline-offset-4 hover:underline hover:text-neon-blue",
        hero: "bg-gradient-sunset text-white font-bold hover:shadow-glow-coral hover:scale-105 transition-all duration-300",
        cyber: "bg-gradient-cyber text-white font-semibold shadow-glow-cyan hover:shadow-glow-neon hover:scale-105 transition-all duration-300",
        neon: "bg-gradient-neon text-white font-bold shadow-glow-neon hover:shadow-[0_0_100px_hsl(190_100%_60%/0.5)] hover:scale-105 transition-all duration-300",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        xl: "h-14 rounded-md px-10 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
