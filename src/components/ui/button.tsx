import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group relative inline-flex items-center justify-center gap-2 font-medium rounded-full shadow-lg transition-all duration-300 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 shadow-blue-500/25 hover:shadow-blue-500/40",
        delete: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-red-500/25 hover:shadow-red-500/40",
        destructive:
          "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-red-500/25 hover:shadow-red-500/40",
        outline:
          "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 focus:ring-gray-500 shadow-gray-500/10 hover:shadow-gray-500/20",
        secondary:
          "bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500 shadow-gray-500/25 hover:shadow-gray-500/40",
        ghost:
          "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 shadow-none hover:shadow-md focus:ring-gray-500",
        link: "bg-transparent hover:bg-transparent text-blue-600 dark:text-blue-400 underline-offset-4 hover:underline shadow-none hover:shadow-none focus:ring-blue-500",
        primary: "bg-primary hover:bg-primary/90 text-primary-foreground focus:ring-primary shadow-primary/25 hover:shadow-primary/40",
      },
      size: {
        default: "h-12 px-6 text-base",
        sm: "h-10 px-4 text-sm",
        lg: "h-14 px-8 text-lg",
        icon: "h-12 w-12 p-0",
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
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
        {/* Background animation */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Content */}
        <span className="relative flex items-center gap-2 transition-transform duration-200 group-hover:scale-105">
          {children}
        </span>

        {/* Ripple effect */}
        <div className="absolute inset-0 rounded-full opacity-0 group-active:opacity-30 bg-white transition-opacity duration-150" />
      </Comp>
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };