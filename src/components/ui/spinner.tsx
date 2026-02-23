import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const spinnerVariants = cva(
  "animate-spin",
  {
    variants: {
      size: {
        xs: "h-3 w-3",
        sm: "h-4 w-4",
        default: "h-6 w-6",
        lg: "h-8 w-8",
        xl: "h-12 w-12",
      },
      variant: {
        default: "text-muted-foreground",
        primary: "text-primary",
        secondary: "text-secondary",
        accent: "text-accent",
        success: "text-success",
        warning: "text-warning",
        destructive: "text-destructive",
        white: "text-white",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
)

export interface SpinnerProps
  extends Omit<React.SVGProps<SVGSVGElement>, "size">,
    VariantProps<typeof spinnerVariants> {}

const Spinner = React.forwardRef<SVGSVGElement, SpinnerProps>(
  ({ className, size, variant, ...props }, ref) => {
    return (
      <Loader2
        ref={ref}
        className={cn(spinnerVariants({ size, variant, className }))}
        {...props}
      />
    )
  }
)
Spinner.displayName = "Spinner"

// Loading overlay component
function LoadingOverlay({ 
  children, 
  loading, 
  className,
  spinnerSize = "lg",
  spinnerVariant = "primary",
  text,
  blur = true
}: {
  children: React.ReactNode
  loading: boolean
  className?: string
  spinnerSize?: VariantProps<typeof spinnerVariants>["size"]
  spinnerVariant?: VariantProps<typeof spinnerVariants>["variant"]
  text?: string
  blur?: boolean
}) {
  return (
    <div className={cn("relative", className)}>
      {children}
      {loading && (
        <div className={cn(
          "absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 z-10",
          blur && "backdrop-blur-sm"
        )}>
          <Spinner size={spinnerSize} variant={spinnerVariant} />
          {text && (
            <p className="text-sm text-muted-foreground animate-pulse">
              {text}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// Pulse loader for different shapes
function PulseLoader({ 
  variant = "default", 
  className 
}: { 
  variant?: "default" | "dots" | "bars"
  className?: string 
}) {
  if (variant === "dots") {
    return (
      <div className={cn("flex space-x-2", className)}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-2 w-2 bg-primary rounded-full animate-pulse"
            style={{
              animationDelay: `${i * 0.1}s`,
              animationDuration: '1s'
            }}
          />
        ))}
      </div>
    )
  }

  if (variant === "bars") {
    return (
      <div className={cn("flex items-end space-x-1", className)}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-1 bg-primary rounded-full animate-pulse"
            style={{
              height: `${12 + (i % 2) * 8}px`,
              animationDelay: `${i * 0.1}s`,
              animationDuration: '0.8s'
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div className={cn("flex justify-center", className)}>
      <div className="h-8 w-8 bg-primary/20 rounded-full animate-pulse" />
    </div>
  )
}

// Page loading component
function PageLoader({ 
  text = "Loading...", 
  className 
}: { 
  text?: string
  className?: string 
}) {
  return (
    <div className={cn(
      "fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm",
      className
    )}>
      <div className="text-center space-y-4">
        <Spinner size="xl" variant="primary" />
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">{text}</h2>
          <div className="flex justify-center">
            <PulseLoader variant="dots" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Button loading state
function LoadingButton({
  children,
  loading = false,
  disabled,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean
}) {
  return (
    <button
      className={className}
      disabled={loading || disabled}
      {...props}
    >
      <div className="flex items-center justify-center gap-2">
        {loading && <Spinner size="sm" variant="white" />}
        {children}
      </div>
    </button>
  )
}

export { 
  Spinner, 
  LoadingOverlay, 
  PulseLoader, 
  PageLoader, 
  LoadingButton,
  spinnerVariants 
}