import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const skeletonVariants = cva(
  "animate-pulse rounded-md bg-muted",
  {
    variants: {
      variant: {
        default: "bg-muted",
        card: "bg-muted/50",
        text: "bg-muted/80",
        avatar: "bg-muted/70",
        image: "bg-muted/60",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

function Skeleton({ className, variant, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(skeletonVariants({ variant, className }))}
      {...props}
    />
  )
}

// Preset skeleton components for common use cases
function SkeletonAvatar({ size = "default", className }: { size?: "sm" | "default" | "lg" | "xl"; className?: string }) {
  const sizeClasses = {
    sm: "h-8 w-8",
    default: "h-10 w-10", 
    lg: "h-12 w-12",
    xl: "h-16 w-16"
  }
  
  return (
    <Skeleton 
      variant="avatar" 
      className={cn("rounded-full", sizeClasses[size], className)} 
    />
  )
}

function SkeletonButton({ className }: { className?: string }) {
  return (
    <Skeleton className={cn("h-10 w-20", className)} />
  )
}

function SkeletonText({ lines = 1, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton 
          key={i} 
          variant="text" 
          className={cn(
            "h-4",
            i === lines - 1 && lines > 1 ? "w-3/4" : "w-full"
          )} 
        />
      ))}
    </div>
  )
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border bg-card p-6", className)}>
      <div className="space-y-3">
        <Skeleton variant="text" className="h-5 w-1/3" />
        <SkeletonText lines={3} />
        <div className="flex gap-2 pt-2">
          <SkeletonButton />
          <SkeletonButton />
        </div>
      </div>
    </div>
  )
}

function SkeletonTable({ rows = 5, columns = 4, className }: { rows?: number; columns?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex gap-4">
        {Array.from({ length: columns }, (_, i) => (
          <Skeleton key={i} variant="text" className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: columns }, (_, colIndex) => (
            <Skeleton 
              key={colIndex} 
              variant="default" 
              className={cn(
                "h-8 flex-1",
                colIndex === 0 && "max-w-16" // First column (avatar/icon)
              )} 
            />
          ))}
        </div>
      ))}
    </div>
  )
}

function SkeletonList({ items = 3, withAvatar = true, className }: { items?: number; withAvatar?: boolean; className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: items }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          {withAvatar && <SkeletonAvatar size="sm" />}
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="h-4 w-3/4" />
            <Skeleton variant="text" className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  )
}

export { 
  Skeleton, 
  SkeletonAvatar, 
  SkeletonButton, 
  SkeletonText, 
  SkeletonCard,
  SkeletonTable,
  SkeletonList,
  skeletonVariants 
}