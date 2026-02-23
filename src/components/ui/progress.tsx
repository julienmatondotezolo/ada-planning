import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const progressVariants = cva(
  "w-full overflow-hidden rounded-full bg-secondary",
  {
    variants: {
      size: {
        xs: "h-1",
        sm: "h-1.5",
        default: "h-2",
        lg: "h-3",
        xl: "h-4",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

const progressBarVariants = cva(
  "h-full w-full flex-1 transition-all duration-300 ease-in-out",
  {
    variants: {
      variant: {
        default: "bg-primary",
        success: "bg-success",
        warning: "bg-warning",
        destructive: "bg-destructive",
        accent: "bg-accent",
        secondary: "bg-secondary",
        pink: "bg-pink",
      },
      animated: {
        true: "transition-all duration-500 ease-out",
        false: "transition-all duration-300 ease-in-out",
      },
    },
    defaultVariants: {
      variant: "default",
      animated: false,
    },
  }
)

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressVariants>,
    VariantProps<typeof progressBarVariants> {
  animated?: boolean
  showValue?: boolean
  striped?: boolean
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, size, variant, animated, showValue, striped, ...props }, ref) => (
  <div className="w-full">
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(progressVariants({ size }), className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          progressBarVariants({ variant, animated }),
          striped && "bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:40px_40px] animate-pulse"
        )}
        style={{ 
          transform: `translateX(-${100 - (value || 0)}%)`,
          ...(striped && {
            backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)"
          })
        }}
      />
    </ProgressPrimitive.Root>
    {showValue && (
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>Progress</span>
        <span>{value}%</span>
      </div>
    )}
  </div>
))
Progress.displayName = ProgressPrimitive.Root.displayName

// Indeterminate loading progress
function LoadingProgress({ 
  variant = "default", 
  size = "default",
  className 
}: {
  variant?: VariantProps<typeof progressBarVariants>["variant"]
  size?: VariantProps<typeof progressVariants>["size"]
  className?: string
}) {
  return (
    <div className={cn(progressVariants({ size }), "relative", className)}>
      <div 
        className={cn(
          progressBarVariants({ variant }),
          "absolute h-full w-1/3 animate-pulse",
        )}
        style={{
          animation: "loading-slide 2s infinite ease-in-out"
        }}
      />
      <style jsx>{`
        @keyframes loading-slide {
          0% { left: -33.333%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  )
}

// Circular progress
function CircularProgress({ 
  value = 0, 
  size = 60, 
  strokeWidth = 4,
  variant = "default",
  showValue = false,
  className 
}: {
  value?: number
  size?: number
  strokeWidth?: number
  variant?: "default" | "success" | "warning" | "destructive" | "accent" | "secondary" | "pink"
  showValue?: boolean
  className?: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset = circumference - (value / 100) * circumference

  const colorMap = {
    default: "stroke-primary",
    success: "stroke-success", 
    warning: "stroke-warning",
    destructive: "stroke-destructive",
    accent: "stroke-accent",
    secondary: "stroke-secondary",
    pink: "stroke-pink"
  }

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted opacity-20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={cn(colorMap[variant], "transition-all duration-300 ease-out")}
        />
      </svg>
      {showValue && (
        <div className="absolute text-xs font-medium">
          {value}%
        </div>
      )}
    </div>
  )
}

// Multi-step progress
function StepProgress({
  steps,
  currentStep = 0,
  variant = "default",
  className
}: {
  steps: string[]
  currentStep?: number
  variant?: VariantProps<typeof progressBarVariants>["variant"]
  className?: string
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Progress bar */}
      <Progress 
        value={(currentStep / (steps.length - 1)) * 100} 
        variant={variant}
        animated
      />
      
      {/* Step indicators */}
      <div className="flex justify-between">
        {steps.map((step, index) => (
          <div 
            key={index} 
            className={cn(
              "flex flex-col items-center text-xs",
              index <= currentStep ? "text-foreground" : "text-muted-foreground"
            )}
          >
            <div className={cn(
              "w-6 h-6 rounded-full border-2 flex items-center justify-center mb-1",
              index < currentStep 
                ? "bg-primary border-primary text-primary-foreground"
                : index === currentStep
                  ? "border-primary text-primary"  
                  : "border-muted"
            )}>
              {index < currentStep ? "✓" : index + 1}
            </div>
            <span className="max-w-16 text-center leading-tight">{step}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export { 
  Progress, 
  LoadingProgress,
  CircularProgress,
  StepProgress,
  progressVariants, 
  progressBarVariants 
}