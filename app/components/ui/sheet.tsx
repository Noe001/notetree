"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg transition-all duration-300 ease-in-out",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b",
        bottom: "inset-x-0 bottom-0 border-t",
        left: "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
        right: "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
)

interface SheetPortalProps {
  children: React.ReactNode
}

const SheetPortal = ({ children }: SheetPortalProps) => {
  if (typeof document === 'undefined') return null
  return import("react-dom").then(ReactDOM => ReactDOM.createPortal(children, document.body))
}

const SheetOverlay = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div"> & { open: boolean }
>(({ className, open, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm",
      open ? "animate-fade-in" : "animate-fade-out",
      className
    )}
    {...props}
  />
))
SheetOverlay.displayName = "SheetOverlay"

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<"div">,
    VariantProps<typeof sheetVariants> {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const SheetContent = React.forwardRef<
  React.ElementRef<"div">,
  SheetContentProps
>(({ side = "right", className, children, open, onOpenChange, ...props }, ref) => {
  const animationClass = {
    top: {
      in: "animate-slide-in-from-top",
      out: "animate-slide-out-to-top",
    },
    bottom: {
      in: "animate-slide-in-from-bottom",
      out: "animate-slide-out-to-bottom",
    },
    left: {
      in: "animate-slide-in-from-left",
      out: "animate-slide-out-to-left",
    },
    right: {
      in: "animate-slide-in-from-right",
      out: "animate-slide-out-to-right",
    },
  }
  return (
    <SheetPortal>
      <SheetOverlay onClick={() => onOpenChange?.(false)} open={open!} />
      <div
        ref={ref}
        className={cn(
          sheetVariants({ side }),
          open ? animationClass[side!].in : animationClass[side!].out,
          className
        )}
        {...props}
      >
        {children}
        <button
          onClick={() => onOpenChange?.(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </SheetPortal>
  )
})
SheetContent.displayName = "SheetContent"

interface SheetProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

const Sheet = ({ open, onOpenChange, children }: SheetProps) => {
  const [isMounted, setIsMounted] = React.useState(open)

  React.useEffect(() => {
    if (open) {
      setIsMounted(true)
    } else {
      const timer = setTimeout(() => setIsMounted(false), 300)
      return () => clearTimeout(timer)
    }
  }, [open])

  if (!isMounted) {
    return null
  }

  return (
    <>
      {React.Children.map(children, (child) => {
        if (
          React.isValidElement<SheetContentProps>(child) &&
          child.type === SheetContent
        ) {
          return React.cloneElement(child, {
            open,
            onOpenChange,
          })
        }
        return child
      })}
    </>
  )
}

const SheetTrigger = React.forwardRef<
  React.ElementRef<"button">,
  React.ComponentPropsWithoutRef<"button">
>(({ className, ...props }, ref) => (
  <button className={cn(className)} ref={ref} {...props} />
))
SheetTrigger.displayName = "SheetTrigger"

const SheetHeader = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
))
SheetHeader.displayName = "SheetHeader"

const SheetTitle = React.forwardRef<
  React.ElementRef<"h2">,
  React.ComponentPropsWithoutRef<"h2">
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
))
SheetTitle.displayName = "SheetTitle"

const SheetDescription = React.forwardRef<
  React.ElementRef<"p">,
  React.ComponentPropsWithoutRef<"p">
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
SheetDescription.displayName = "SheetDescription"

export {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
}
