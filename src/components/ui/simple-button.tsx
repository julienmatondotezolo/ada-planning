'use client';

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
        destructive:
          "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
        outline:
          "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 focus:ring-gray-500",
        secondary:
          "bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500",
        ghost:
          "bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-500",
        primary: 
          "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500",
      },
      size: {
        default: "h-10 px-4 text-sm",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10 p-0",
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
    VariantProps<typeof buttonVariants> {}

const SimpleButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);

SimpleButton.displayName = "SimpleButton";

export { SimpleButton, buttonVariants };