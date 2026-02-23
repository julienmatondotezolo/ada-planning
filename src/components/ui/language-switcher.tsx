import * as React from "react"
import { cn } from "@/lib/utils"
import { type Locale } from "@/lib/i18n"

// Import flag icons from country-flag-icons package
import { US } from 'country-flag-icons/react/3x2'
import { FR } from 'country-flag-icons/react/3x2' 
import { NL } from 'country-flag-icons/react/3x2'

interface LanguageSwitcherProps {
  currentLocale: Locale
  onLocaleChange: (locale: Locale) => void
  className?: string
  variant?: 'default' | 'minimal' | 'button'
  size?: 'sm' | 'md' | 'lg'
}

const languages = {
  en: { label: 'English', FlagIcon: US },
  fr: { label: 'Français', FlagIcon: FR },
  nl: { label: 'Nederlands', FlagIcon: NL },
}

export function LanguageSwitcher({
  currentLocale,
  onLocaleChange,
  className,
  variant = 'default',
  size = 'md',
}: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const sizeStyles = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-2',
    lg: 'text-base px-4 py-3',
  }

  const variantStyles = {
    default: 'bg-card border border-border hover:bg-muted/50',
    minimal: 'bg-transparent hover:bg-muted/30',
    button: 'bg-primary text-primary-foreground hover:bg-primary/90',
  }

  if (variant === 'minimal') {
    const CurrentFlag = languages[currentLocale].FlagIcon
    return (
      <div className={cn("relative", className)}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center gap-2 rounded-md transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-ring",
            variantStyles[variant],
            sizeStyles[size],
          )}
        >
          <CurrentFlag className="w-4 h-3" />
          <span className="font-medium">{currentLocale.toUpperCase()}</span>
          <svg
            className={cn(
              "w-4 h-4 transition-transform",
              isOpen && "rotate-180"
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute top-full mt-1 left-0 z-50 bg-popover border border-border rounded-md shadow-lg min-w-[120px]">
            {Object.entries(languages).map(([locale, lang]) => {
              const FlagIcon = lang.FlagIcon
              return (
                <button
                  key={locale}
                  onClick={() => {
                    onLocaleChange(locale as Locale)
                    setIsOpen(false)
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted/50",
                    "first:rounded-t-md last:rounded-b-md transition-colors",
                    currentLocale === locale && "bg-muted text-foreground font-medium"
                  )}
                >
                  <FlagIcon className="w-4 h-3" />
                  <span className="text-sm">{lang.label}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  const CurrentFlag = languages[currentLocale].FlagIcon
  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 rounded-md transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-ring",
          variantStyles[variant],
          sizeStyles[size],
        )}
      >
        <CurrentFlag className="w-5 h-4" />
        <span className="font-medium">{languages[currentLocale].label}</span>
        <svg
          className={cn(
            "w-4 h-4 transition-transform",
            isOpen && "rotate-180"
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 left-0 z-50 bg-popover border border-border rounded-md shadow-lg min-w-[150px]">
          {Object.entries(languages).map(([locale, lang]) => {
            const FlagIcon = lang.FlagIcon
            return (
              <button
                key={locale}
                onClick={() => {
                  onLocaleChange(locale as Locale)
                  setIsOpen(false)
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted/50",
                  "first:rounded-t-md last:rounded-b-md transition-colors",
                  currentLocale === locale && "bg-muted text-foreground font-medium"
                )}
              >
                <FlagIcon className="w-5 h-4" />
                <span className="text-sm">{lang.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Hook for managing locale state
export function useLocale() {
  const [locale, setLocale] = React.useState<Locale>('en')

  React.useEffect(() => {
    // Try to get saved locale from localStorage
    const savedLocale = localStorage.getItem('ada-locale') as Locale
    if (savedLocale && ['en', 'fr', 'nl'].includes(savedLocale)) {
      setLocale(savedLocale)
    } else {
      // Fallback to browser detection
      const browserLang = navigator.language.split('-')[0]
      if (['en', 'fr', 'nl'].includes(browserLang)) {
        setLocale(browserLang as Locale)
      }
    }
  }, [])

  const changeLocale = React.useCallback((newLocale: Locale) => {
    setLocale(newLocale)
    localStorage.setItem('ada-locale', newLocale)
  }, [])

  return { locale, setLocale: changeLocale }
}