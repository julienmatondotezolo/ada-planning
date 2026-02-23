import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Badge } from "./badge"

interface FontSpecimenProps {
  weight: string
  size: string
  lineHeight: string
  spacing: string
  className?: string
  children: React.ReactNode
}

function FontSpecimen({ 
  weight, 
  size, 
  lineHeight, 
  spacing, 
  className, 
  children 
}: FontSpecimenProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground uppercase tracking-wide font-medium">
          {weight}
        </div>
        <div className="text-xs text-muted-foreground">
          {size} / {lineHeight} line height
        </div>
      </div>
      <div className={cn("text-foreground", className)}>
        {children}
      </div>
      <div className="text-xs text-muted-foreground">
        Spacing: {spacing}
      </div>
    </div>
  )
}

interface FontViewerProps {
  className?: string
  sampleText?: string
  language?: 'en' | 'fr' | 'nl'
}

export function FontViewer({ 
  className, 
  sampleText,
  language = 'en' 
}: FontViewerProps) {
  const samples = {
    en: sampleText || "You have the right to remain private™",
    fr: sampleText || "Vous avez le droit de rester privé™", 
    nl: sampleText || "Je hebt het recht om privé te blijven™"
  }
  
  const text = samples[language]

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          Font Viewer
          <Badge variant="outline" className="text-xs">
            Inter + Plus Jakarta Sans
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Display Font - Plus Jakarta Sans */}
        <div className="space-y-6">
          <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide border-b border-border pb-2">
            Plus Jakarta Sans - Display Font
          </div>
          
          <FontSpecimen 
            weight="Display / Bold" 
            size="60px" 
            lineHeight="100%" 
            spacing="-2%"
            className="text-6xl font-bold font-display leading-none tracking-tight"
          >
            {text}
          </FontSpecimen>

          <FontSpecimen 
            weight="Display / Semibold" 
            size="48px" 
            lineHeight="110%" 
            spacing="-1%"
            className="text-5xl font-semibold font-display leading-tight tracking-tight"
          >
            {text}
          </FontSpecimen>

          <FontSpecimen 
            weight="Display / Medium" 
            size="36px" 
            lineHeight="120%" 
            spacing="0%"
            className="text-4xl font-medium font-display leading-tight"
          >
            {text}
          </FontSpecimen>
        </div>

        {/* Body Font - Inter */}
        <div className="space-y-6">
          <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide border-b border-border pb-2">
            Inter - Body Font
          </div>

          <FontSpecimen 
            weight="Heading 1 / Bold" 
            size="32px" 
            lineHeight="120%" 
            spacing="-0.5%"
            className="text-3xl font-bold leading-tight tracking-tight"
          >
            {text}
          </FontSpecimen>

          <FontSpecimen 
            weight="Heading 2 / Semibold" 
            size="24px" 
            lineHeight="130%" 
            spacing="0%"
            className="text-2xl font-semibold leading-tight"
          >
            {text}
          </FontSpecimen>

          <FontSpecimen 
            weight="Heading 3 / Medium" 
            size="20px" 
            lineHeight="130%" 
            spacing="0%"
            className="text-xl font-medium leading-tight"
          >
            {text}
          </FontSpecimen>

          <FontSpecimen 
            weight="Body / Regular" 
            size="16px" 
            lineHeight="150%" 
            spacing="0%"
            className="text-base font-normal leading-relaxed"
          >
            {text}
          </FontSpecimen>

          <FontSpecimen 
            weight="Body / Medium" 
            size="16px" 
            lineHeight="150%" 
            spacing="0%"
            className="text-base font-medium leading-relaxed"
          >
            {text}
          </FontSpecimen>

          <FontSpecimen 
            weight="Caption / Regular" 
            size="14px" 
            lineHeight="140%" 
            spacing="0.5%"
            className="text-sm font-normal leading-normal tracking-wide"
          >
            {text}
          </FontSpecimen>

          <FontSpecimen 
            weight="Caption / Medium" 
            size="14px" 
            lineHeight="140%" 
            spacing="0.5%"
            className="text-sm font-medium leading-normal tracking-wide"
          >
            {text}
          </FontSpecimen>

          <FontSpecimen 
            weight="Small / Regular" 
            size="12px" 
            lineHeight="140%" 
            spacing="1%"
            className="text-xs font-normal leading-normal tracking-wide"
          >
            {text}
          </FontSpecimen>
        </div>

        {/* Weight Specimens */}
        <div className="space-y-6">
          <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide border-b border-border pb-2">
            Weight Comparison - 16px
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <FontSpecimen 
                weight="Light / 300" 
                size="16px" 
                lineHeight="150%" 
                spacing="0%"
                className="text-base font-light leading-relaxed"
              >
                {text}
              </FontSpecimen>

              <FontSpecimen 
                weight="Regular / 400" 
                size="16px" 
                lineHeight="150%" 
                spacing="0%"
                className="text-base font-normal leading-relaxed"
              >
                {text}
              </FontSpecimen>

              <FontSpecimen 
                weight="Medium / 500" 
                size="16px" 
                lineHeight="150%" 
                spacing="0%"
                className="text-base font-medium leading-relaxed"
              >
                {text}
              </FontSpecimen>

              <FontSpecimen 
                weight="Semibold / 600" 
                size="16px" 
                lineHeight="150%" 
                spacing="0%"
                className="text-base font-semibold leading-relaxed"
              >
                {text}
              </FontSpecimen>
            </div>

            <div className="space-y-4">
              <FontSpecimen 
                weight="Bold / 700" 
                size="16px" 
                lineHeight="150%" 
                spacing="0%"
                className="text-base font-bold leading-relaxed"
              >
                {text}
              </FontSpecimen>

              <FontSpecimen 
                weight="Extrabold / 800" 
                size="16px" 
                lineHeight="150%" 
                spacing="0%"
                className="text-base font-extrabold leading-relaxed"
              >
                {text}
              </FontSpecimen>

              <FontSpecimen 
                weight="Black / 900" 
                size="16px" 
                lineHeight="150%" 
                spacing="0%"
                className="text-base font-black leading-relaxed"
              >
                {text}
              </FontSpecimen>
            </div>
          </div>
        </div>

        {/* Typography Scale */}
        <div className="space-y-6">
          <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide border-b border-border pb-2">
            Size Scale - Medium Weight
          </div>

          <div className="space-y-3">
            {[
              { size: '12px', class: 'text-xs font-medium' },
              { size: '14px', class: 'text-sm font-medium' },
              { size: '16px', class: 'text-base font-medium' },
              { size: '18px', class: 'text-lg font-medium' },
              { size: '20px', class: 'text-xl font-medium' },
              { size: '24px', class: 'text-2xl font-medium' },
              { size: '30px', class: 'text-3xl font-medium' },
              { size: '36px', class: 'text-4xl font-medium' },
              { size: '48px', class: 'text-5xl font-medium' },
              { size: '60px', class: 'text-6xl font-medium' }
            ].map((specimen, index) => (
              <div key={index} className="flex items-baseline gap-4">
                <div className="text-xs text-muted-foreground w-12 flex-shrink-0">
                  {specimen.size}
                </div>
                <div className={cn(specimen.class, "leading-tight")}>
                  {text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Quick usage component for different languages
export function FontViewerShowcase() {
  return (
    <div className="space-y-8">
      <FontViewer language="en" />
      <FontViewer language="fr" />
      <FontViewer language="nl" />
    </div>
  )
}

export { FontSpecimen }