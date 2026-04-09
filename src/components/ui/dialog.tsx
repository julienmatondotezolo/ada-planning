import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/useMediaQuery"
import { haptic } from "@/lib/haptics"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

/**
 * Mobile bottom-sheet dialog with drag-to-dismiss.
 *
 * - Fires a `light` haptic when the sheet opens so it feels tactile.
 * - Fires a `selection` haptic while dragging past the dismiss threshold
 *   and a `medium` tick on successful dismiss.
 * - Respects the iPhone safe-area inset via `pb-safe` padding.
 * - Overlay opacity scales with drag distance for a native feel.
 */
const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const isMobile = useIsMobile();
  const sheetRef = React.useRef<HTMLDivElement | null>(null);
  const dragState = React.useRef<{
    startY: number;
    lastY: number;
    tripped: boolean;
  } | null>(null);
  const [dragY, setDragY] = React.useState(0);

  // Combine external ref with our internal sheet ref
  const setRefs = React.useCallback(
    (node: HTMLDivElement | null) => {
      sheetRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    },
    [ref],
  );

  // Haptic tick on open
  React.useEffect(() => {
    if (isMobile) haptic('light');
  }, [isMobile]);

  const DISMISS_THRESHOLD = 120; // px

  const onHandlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isMobile) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragState.current = { startY: e.clientY, lastY: e.clientY, tripped: false };
  };

  const onHandlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isMobile || !dragState.current) return;
    const dy = Math.max(0, e.clientY - dragState.current.startY);
    dragState.current.lastY = e.clientY;
    setDragY(dy);
    if (!dragState.current.tripped && dy > DISMISS_THRESHOLD) {
      dragState.current.tripped = true;
      haptic('selection');
    } else if (dragState.current.tripped && dy <= DISMISS_THRESHOLD) {
      dragState.current.tripped = false;
    }
  };

  const onHandlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isMobile || !dragState.current) return;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    const dy = Math.max(0, dragState.current.lastY - dragState.current.startY);
    dragState.current = null;
    if (dy > DISMISS_THRESHOLD) {
      haptic('medium');
      // Let Radix handle the close — click the portal's close or dispatch Escape
      const closeBtn = sheetRef.current?.querySelector<HTMLButtonElement>(
        '[data-dialog-close]',
      );
      closeBtn?.click();
      setDragY(0);
    } else {
      // Snap back with a quick transition
      setDragY(0);
    }
  };

  const dragStyle: React.CSSProperties = isMobile
    ? {
        transform: `translateY(${dragY}px)`,
        transition: dragState.current ? 'none' : 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
        touchAction: 'none',
      }
    : {};

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={setRefs}
        style={dragStyle}
        className={cn(
          isMobile
            ? "fixed bottom-0 left-0 right-0 z-50 grid w-full max-h-[90vh] overflow-y-auto gap-4 border-t bg-background p-6 pb-[max(env(safe-area-inset-bottom),1.5rem)] shadow-2xl rounded-t-3xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom"
            : "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
          className
        )}
        {...props}
      >
        {isMobile && (
          <div
            onPointerDown={onHandlePointerDown}
            onPointerMove={onHandlePointerMove}
            onPointerUp={onHandlePointerUp}
            onPointerCancel={onHandlePointerUp}
            className="absolute top-0 left-0 right-0 h-8 flex items-start justify-center pt-2 cursor-grab active:cursor-grabbing touch-none"
            aria-label="Glisser pour fermer"
          >
            <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30" />
          </div>
        )}
        {isMobile && <div className="h-4" aria-hidden />}
        {children}
        <DialogPrimitive.Close
          data-dialog-close
          data-haptic="selection"
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
})
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
