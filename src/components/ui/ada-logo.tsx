import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const logoVariants = cva(
  "inline-block",
  {
    variants: {
      size: {
        sm: "h-8 w-auto",
        md: "h-12 w-auto", 
        lg: "h-16 w-auto",
        xl: "h-24 w-auto",
      },
      variant: {
        primary: "[&>path]:fill-primary [&>path]:stroke-primary",
        secondary: "[&>path]:fill-secondary [&>path]:stroke-secondary", 
        muted: "[&>path]:fill-muted-foreground [&>path]:stroke-muted-foreground",
        white: "[&>path]:fill-background [&>path]:stroke-border",
      },
      interactive: {
        true: "cursor-pointer transition-opacity hover:opacity-80",
        false: "",
      }
    },
    defaultVariants: {
      size: "md",
      variant: "primary",
      interactive: false,
    },
  }
)

export interface AdaLogoProps
  extends React.SVGAttributes<SVGSVGElement>,
    VariantProps<typeof logoVariants> {}

const AdaLogo = React.forwardRef<SVGSVGElement, AdaLogoProps>(
  ({ className, size, variant, interactive, ...props }, ref) => {
    return (
      <svg
        ref={ref}
        className={cn(logoVariants({ size, variant, interactive, className }))}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 689.5 300.5"
        aria-label="ADA Systems Logo"
        role="img"
        {...props}
      >
        <path 
          fillRule="evenodd" 
          strokeWidth="1px" 
          strokeLinecap="butt" 
          strokeLinejoin="miter" 
          d="M2.228,298.969 L80.111,298.969 L153.894,114.729 L242.023,298.969 L364.995,298.969 C364.995,298.969 479.769,292.006 479.769,168.017 C479.769,44.028 388.307,8.154 348.599,8.154 C308.891,8.154 242.023,8.154 242.023,8.154 L242.023,79.887 L319.906,79.887 C319.906,79.887 412.135,72.432 412.135,157.769 C412.135,243.107 348.599,237.701 348.599,237.701 L289.163,237.701 L194.884,22.500 C194.884,22.500 182.730,1.027 157.993,2.005 C133.336,2.980 123.151,22.500 123.151,22.500 L2.228,298.969 ZM496.165,186.463 C496.165,186.463 503.447,126.624 473.620,71.689 C485.582,41.774 498.215,16.352 498.215,16.352 C498.215,16.352 503.779,2.182 526.908,2.005 C552.863,1.807 557.651,16.352 557.651,16.352 L686.772,298.969 L608.889,298.969 L531.007,114.729 L496.165,186.463 Z"
        />
      </svg>
    )
  }
)
AdaLogo.displayName = "AdaLogo"

export { AdaLogo, logoVariants }