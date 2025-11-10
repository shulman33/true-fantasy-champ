"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { cn } from "@/lib/utils"

function RetroTooltipProvider({
  delayDuration = 200,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      delayDuration={delayDuration}
      {...props}
    />
  )
}

const TooltipContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
}>({
  open: false,
  setOpen: () => {},
})

function RetroTooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  const [open, setOpen] = React.useState(false)

  return (
    <TooltipContext.Provider value={{ open, setOpen }}>
      <RetroTooltipProvider>
        <TooltipPrimitive.Root open={open} onOpenChange={setOpen} {...props} />
      </RetroTooltipProvider>
    </TooltipContext.Provider>
  )
}

function RetroTooltipTrigger({
  onClick,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  const { open, setOpen } = React.useContext(TooltipContext)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Toggle tooltip on click for mobile support
    setOpen(!open)
    // Call the original onClick if provided
    onClick?.(e)
  }

  return (
    <TooltipPrimitive.Trigger
      onClick={handleClick}
      {...props}
    />
  )
}

function RetroTooltipContent({
  className,
  sideOffset = 8,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          // Base styles
          "z-50 relative overflow-hidden",
          // Retro styling
          "bg-black/95 backdrop-blur-sm",
          "border-4 border-[#00ff00]",
          // Pixelated corners
          "rounded-sm",
          // Typography
          "font-press-start text-[8px] sm:text-[10px] leading-relaxed",
          "text-[#00ff00]",
          // Sizing
          "max-w-[200px] sm:max-w-[300px] md:max-w-[350px]",
          "px-3 py-2 sm:px-4 sm:py-3",
          // Shadow for depth
          "[box-shadow:4px_4px_0px_0px_rgba(0,0,0,0.8)]",
          // Animations
          "animate-in fade-in-0 zoom-in-95",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          "data-[side=bottom]:slide-in-from-top-2",
          "data-[side=left]:slide-in-from-right-2",
          "data-[side=right]:slide-in-from-left-2",
          "data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        {...props}
      >
        {/* Scanline effect overlay */}
        <div className="absolute inset-0 pointer-events-none scanlines opacity-20" />

        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>

        {/* Custom pixelated arrow */}
        <TooltipPrimitive.Arrow
          className="fill-[#00ff00] z-50"
          width={12}
          height={6}
        />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export { RetroTooltip, RetroTooltipTrigger, RetroTooltipContent, RetroTooltipProvider }
